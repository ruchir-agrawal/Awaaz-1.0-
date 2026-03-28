import { useState, useRef, useCallback, useEffect } from "react";
import { getSarvamSTT, getSarvamTTS } from "@/lib/sarvam";
import { type ChatMessage } from "@/lib/ollama";

export type AgentState = "idle" | "listening" | "thinking" | "speaking" | "error";

interface UseVoiceAgentProps {
    systemPrompt: string;
    businessName?: string;
    model?: string;
    useCloudLLM?: boolean;
    isContinuous?: boolean;
    llmProvider?: "groq" | "ollama" | "xai" | "gemini";
}

// Split text into speakable sentence chunks as it streams in
// Splits on . ! ? and also on Hindi danda (।)
const SENTENCE_BOUNDARY = /([.!?।]+\s*)/;

function splitIntoSentences(text: string): { sentences: string[]; remainder: string } {
    const parts = text.split(SENTENCE_BOUNDARY);
    const sentences: string[] = [];
    let i = 0;
    while (i < parts.length - 1) {
        const sentence = (parts[i] + (parts[i + 1] || "")).trim();
        if (sentence.length > 0) sentences.push(sentence);
        i += 2;
    }
    const remainder = parts[parts.length - 1] || "";
    return { sentences, remainder };
}

export function useVoiceAgent({ 
    systemPrompt, 
    businessName = "Awaaz Business",
    model = "qwen2.5:7b", 
    useCloudLLM = true, 
    isContinuous = false, 
    llmProvider = "groq" 
}: UseVoiceAgentProps) {
    const [agentState, setAgentState] = useState<AgentState>("idle");
    const [messages, setMessages] = useState<ChatMessage[]>([{ role: "system", content: systemPrompt }]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const messagesRef = useRef<ChatMessage[]>(messages);
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<BlobPart[]>([]);
    const currentAudio = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const silenceTimeoutRef = useRef<any>(null);

    // Audio playback queue — for sentence-streaming
    const audioQueueRef = useRef<string[]>([]); // queue of base64 audio strings
    const isPlayingRef = useRef(false);
    const isPipelineActiveRef = useRef(false); // tracks if pipeline is still running

    // TTS serialization chain — ensures TTS calls fire ONE AT A TIME in order
    // This prevents concurrent Sarvam requests from resolving out-of-order
    const ttsChainRef = useRef<Promise<void>>(Promise.resolve());

    // VAD Parameters
    const SILENCE_THRESHOLD = -45; // dB
    const SILENCE_DURATION = 800; // ms

    const stopMic = useCallback(() => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
        if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
            try {
                mediaRecorder.current.stop();
            } catch (e) {
                console.warn("MediaRecorder stop error:", e);
            }
        }
        if (audioContextRef.current && audioContextRef.current.state !== "closed") {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
    }, []);

    // ── Audio Queue Player ───────────────────────────────────────────────────
    // Plays queued audio chunks back-to-back with zero gap
    const playNextInQueue = useCallback(() => {
        if (audioQueueRef.current.length === 0) {
            // Queue empty — if pipeline is done, we're fully done
            if (!isPipelineActiveRef.current) {
                isPlayingRef.current = false;
                setAgentState("idle");
                if (isContinuous) {
                    setTimeout(() => startListening(), 500);
                }
            } else {
                // Pipeline still streaming — wait for more audio
                isPlayingRef.current = false;
            }
            return;
        }

        isPlayingRef.current = true;
        setAgentState("speaking");
        const base64Audio = audioQueueRef.current.shift()!;
        const audioSrc = `data:audio/wav;base64,${base64Audio}`;
        currentAudio.current = new Audio(audioSrc);

        currentAudio.current.onended = () => {
            playNextInQueue();
        };

        currentAudio.current.onerror = (e) => {
            console.error("Audio chunk playback error:", e);
            playNextInQueue(); // skip bad chunk
        };

        currentAudio.current.play().catch(e => {
            console.error("Audio playback failed:", e);
            playNextInQueue();
        });
    }, [isContinuous]);

    // Enqueue a base64 audio string and start playing if not already
    const enqueueAudio = useCallback((base64Audio: string) => {
        audioQueueRef.current.push(base64Audio);
        if (!isPlayingRef.current) {
            playNextInQueue();
        }
    }, [playNextInQueue]);

    // ── TTS for a single sentence chunk ─────────────────────────────────────
    // Serialized through ttsChainRef: each call waits for the previous to finish
    // before firing its own Sarvam request — guarantees strict playback order.
    const speakSentence = useCallback((sentence: string): Promise<void> => {
        if (!sentence.trim()) return Promise.resolve();
        // Chain this call after the previous one — serializes TTS requests
        ttsChainRef.current = ttsChainRef.current.then(async () => {
            try {
                const audioData = await getSarvamTTS(sentence.trim());
                enqueueAudio(audioData);
            } catch (err) {
                console.error("TTS chunk error (skipping):", err);
            }
        });
        return ttsChainRef.current;
    }, [enqueueAudio]);

    // ── Main Pipeline ────────────────────────────────────────────────────────
    const handlePipeline = async (audioBlob: Blob) => {
        setAgentState("thinking");
        isPipelineActiveRef.current = true;
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        // Reset the TTS chain so a fresh call sequence starts
        ttsChainRef.current = Promise.resolve();

        try {
            // STEP 1: STT
            const transcribedText = await getSarvamSTT(audioBlob);
            if (!transcribedText.trim()) {
                setAgentState("idle");
                isPipelineActiveRef.current = false;
                return;
            }

            const userMessage: ChatMessage = { role: "user", content: transcribedText };
            const updatedWithUser: ChatMessage[] = [...messagesRef.current, userMessage];
            setMessages(updatedWithUser);
            messagesRef.current = updatedWithUser;

            // STEP 2: LLM — Streaming where possible (Groq + xAI support SSE)
            let fullResponse = "";
            let streamBuffer = ""; // accumulates partial tokens between sentence boundaries

            const currentHistory = updatedWithUser;

            if (useCloudLLM && (llmProvider === "groq" || llmProvider === "xai")) {
                // ── STREAMING PATH (Groq / xAI) ─────────────────────────
                const isGroq = llmProvider === "groq";
                const apiKey = isGroq
                    ? import.meta.env.VITE_GROQ_API_KEY
                    : import.meta.env.VITE_XAI_API_KEY;

                if (!apiKey) throw new Error(`${isGroq ? "Groq" : "xAI"} API Key missing`);

                const endpoint = isGroq
                    ? "/groq-api/openai/v1/chat/completions"
                    : "/xai-api/v1/chat/completions";

                const modelId = isGroq ? "llama-3.3-70b-versatile" : "grok-3-mini";

                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: currentHistory,
                        temperature: 0.7,
                        stream: true, // ← KEY: enable streaming
                    }),
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(`${isGroq ? "Groq" : "xAI"} API Error: ${response.status} - ${errData.error?.message || "Unknown"}`);
                }

                const reader = response.body!.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (!line.startsWith("data: ")) continue;
                        const data = line.slice(6).trim();
                        if (data === "[DONE]") break;

                        try {
                            const parsed = JSON.parse(data);
                            const token = parsed.choices?.[0]?.delta?.content || "";
                            if (!token) continue;

                            fullResponse += token;
                            streamBuffer += token;

                            // Check if we have any complete sentences in the buffer
                            const { sentences, remainder } = splitIntoSentences(streamBuffer);
                            if (sentences.length > 0) {
                                streamBuffer = remainder;
                                // Queue each sentence via the serialization chain
                                // (fire-and-forget onto chain — order is preserved by chain)
                                for (const sentence of sentences) {
                                    speakSentence(sentence);
                                }
                            }
                        } catch {
                            // Malformed SSE chunk — skip
                        }
                    }
                }

                // Flush any remaining buffer after stream ends
                if (streamBuffer.trim()) {
                    speakSentence(streamBuffer.trim()); // add to chain
                }

                // Wait for ALL TTS chain calls to finish enqueuing
                await ttsChainRef.current;

            } else if (useCloudLLM && llmProvider === "gemini") {
                // ── NON-STREAMING PATH (Gemini) ──────────────────────────
                const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
                if (!geminiKey) throw new Error("Gemini API Key missing (VITE_GEMINI_API_KEY)");

                const response = await fetch(`/gemini-api/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        system_instruction: { parts: { text: systemPrompt } },
                        contents: currentHistory
                            .filter(m => m.role !== "system")
                            .map(m => ({
                                role: m.role === "assistant" ? "model" : "user",
                                parts: [{ text: m.content }],
                            })),
                        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
                    }),
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(`Gemini API Error: ${response.status} - ${errData.error?.message || "Unknown"}`);
                }

                const data = await response.json();
                fullResponse = data.candidates[0].content.parts[0].text;

                // Sentence-split the full response and TTS in order
                const { sentences, remainder } = splitIntoSentences(fullResponse);
                const allChunks = remainder.trim() ? [...sentences, remainder.trim()] : sentences;
                for (const chunk of allChunks) {
                    await speakSentence(chunk);
                }

            } else {
                // ── LOCAL OLLAMA ─────────────────────────────────────────
                const response = await fetch("http://localhost:11434/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ model, messages: currentHistory, stream: false }),
                });
                if (!response.ok) throw new Error("Local Ollama connection failed. Is it running?");
                const data = await response.json();
                fullResponse = data.message.content;

                const { sentences, remainder } = splitIntoSentences(fullResponse);
                const allChunks = remainder.trim() ? [...sentences, remainder.trim()] : sentences;
                for (const chunk of allChunks) {
                    await speakSentence(chunk);
                }
            }

            // STEP 3: Action Parsing (strip [[ACTION:...]] from response for UI)
            const actionRegex = /\[\[ACTION:\s*(\w+)\s*\|(.*?)\]\]/g;
            let match;
            let cleanResponse = fullResponse;

            while ((match = actionRegex.exec(fullResponse)) !== null) {
                const actionType = match[1];
                const actionParamsStr = match[2];
                const params: any = {};
                actionParamsStr.split("|").forEach(part => {
                    const [key, val] = part.split(":").map(s => s.trim());
                    if (key && val) params[key] = val;
                });

                console.log(`Triggering Google Action: ${actionType}`, params);
                const bridgeUrl = import.meta.env.VITE_GOOGLE_BRIDGE_URL;
                if (bridgeUrl) {
                    // 1. Prepare Full Transcript
                    const transcript = messagesRef.current
                        .filter(m => m.role !== 'system')
                        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
                        .join('\n\n');

                    // 2. Prepare Audio Base64 if available
                    let audioBase64 = "";
                    if (audioChunks.current.length > 0) {
                        const blob = new Blob(audioChunks.current, { type: "audio/wav" });
                        audioBase64 = await new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const base64 = (reader.result as string).split(',')[1];
                                resolve(base64);
                            };
                            reader.readAsDataURL(blob);
                        });
                    }

                    // 3. Normalized Phone
                    if (params.mobile || params.patient_mobile_no) {
                        const raw = params.mobile || params.patient_mobile_no;
                        params.mobile = raw.replace(/[^\d+]/g, '');
                    }

                    fetch(bridgeUrl, {
                        method: "POST",
                        mode: "no-cors",
                        body: JSON.stringify({ 
                            type: actionType, 
                            businessName, 
                            data: params,
                            transcript,
                            audioBase64
                        }),
                    }).catch(err => console.error("Google Bridge Error:", err));
                }

                cleanResponse = cleanResponse.replace(match[0], "");
            }

            // STEP 4: Update message history with clean response
            const finalMessages: ChatMessage[] = [
                ...messagesRef.current,
                { role: "assistant", content: cleanResponse.trim() },
            ];
            setMessages(finalMessages);
            messagesRef.current = finalMessages;

            // Signal that the pipeline is done — playNextInQueue will handle state
            isPipelineActiveRef.current = false;
            // If nothing is playing yet, trigger idle/restart
            if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
                setAgentState("idle");
                if (isContinuous) {
                    setTimeout(() => startListening(), 500);
                }
            }

        } catch (err: any) {
            console.error("Pipeline Error:", err);
            isPipelineActiveRef.current = false;
            setErrorMsg(err.message || "An error occurred.");
            setAgentState("error");
        }
    };

    const startListening = useCallback(async () => {
        try {
            setErrorMsg(null);

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Mic access requires HTTPS. Please use the localtunnel URL (https).");
            }

            if (currentAudio.current) {
                currentAudio.current.pause();
                currentAudio.current.currentTime = 0;
            }

            if (audioContextRef.current) {
                await audioContextRef.current.close().catch(() => { });
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Float32Array(bufferLength);

            const checkSilence = () => {
                if (!mediaRecorder.current || mediaRecorder.current.state !== "recording") return;

                analyserRef.current?.getFloatTimeDomainData(dataArray);

                let sumSquares = 0.0;
                for (const amplitude of dataArray) {
                    sumSquares += amplitude * amplitude;
                }
                const rms = Math.sqrt(sumSquares / dataArray.length);
                const db = 20 * Math.log10(rms);

                if (db < SILENCE_THRESHOLD) {
                    if (!silenceTimeoutRef.current) {
                        silenceTimeoutRef.current = setTimeout(() => {
                            console.log("Silence detected, stopping...");
                            stopMic();
                        }, SILENCE_DURATION);
                    }
                } else {
                    if (silenceTimeoutRef.current) {
                        clearTimeout(silenceTimeoutRef.current);
                        silenceTimeoutRef.current = null;
                    }
                }

                if (mediaRecorder.current?.state === "recording") {
                    requestAnimationFrame(checkSilence);
                }
            };

            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
                stream.getTracks().forEach(track => track.stop());
                await handlePipeline(audioBlob);
            };

            mediaRecorder.current.start();
            setAgentState("listening");
            requestAnimationFrame(checkSilence);

        } catch (err: any) {
            console.error("Microphone error:", err);
            setErrorMsg(`Microphone error: ${err.message || 'Check browser permissions'}`);
            setAgentState("error");
        }
    }, [agentState, stopMic]);

    const stopAgent = useCallback(() => {
        stopMic();
        isPipelineActiveRef.current = false;
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        if (currentAudio.current) {
            currentAudio.current.pause();
            currentAudio.current.currentTime = 0;
        }
        setAgentState("idle");
    }, [stopMic]);

    const clearHistory = useCallback(() => {
        const resetMessages: ChatMessage[] = [{ role: "system", content: systemPrompt }];
        setMessages(resetMessages);
        messagesRef.current = resetMessages;
        setAgentState("idle");
        setErrorMsg(null);
    }, [systemPrompt]);

    // Update system prompt if it changes (e.g., loaded from Supabase)
    useEffect(() => {
        setMessages(prev => {
            if (prev[0]?.role === "system") {
                const refreshed: ChatMessage[] = [...prev];
                refreshed[0].content = systemPrompt;
                messagesRef.current = refreshed;
                return refreshed;
            }
            return prev;
        });
    }, [systemPrompt]);

    return {
        agentState,
        messages,
        errorMsg,
        startListening,
        stopListening: stopMic,
        stopAgent,
        clearHistory,
    };
}
