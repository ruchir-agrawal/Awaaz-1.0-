import { useState, useRef, useCallback, useEffect } from "react";
import { getSarvamSTT, getSarvamTTS } from "@/lib/sarvam";
import { buildBridgePayload, postBridgeJson } from "@/lib/googleSheet";
import { type ChatMessage } from "@/lib/ollama";

export type AgentState = "idle" | "listening" | "thinking" | "speaking" | "error";

interface UseVoiceAgentProps {
    systemPrompt: string;
    businessName?: string;
    businessSheetId?: string | null;
    businessSheetTabName?: string | null;
    model?: string;
    cloudModel?: string;
    useCloudLLM?: boolean;
    isContinuous?: boolean;
    llmProvider?: "groq" | "ollama" | "xai" | "gemini";
    voiceSpeaker?: string;
    voicePace?: number;
    voiceLanguageCode?: string;
    sttMode?: "transcribe" | "translate" | "verbatim" | "translit" | "codemix";
    disableSideEffects?: boolean;
    maxTokens?: number;
}

interface VoiceAgentMetrics {
    lastTranscriptionMs: number | null;
    lastResponseMs: number | null;
    lastSpeechStartMs: number | null;
    lastTurnMs: number | null;
}

const SENTENCE_BOUNDARY = /([.!?।]+\s*)/;

// Strip ALL [[...]] patterns before TTS — prevents AI from speaking action tags aloud
const TAG_STRIP_REGEX = /\[\[.*?\]\]/gs;

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
    businessSheetId,
    businessSheetTabName,
    model = "qwen2.5:7b",
    cloudModel,
    useCloudLLM = true,
    isContinuous = false,
    llmProvider = "groq",
    voiceSpeaker = "shubh",
    voicePace = 1.1,
    voiceLanguageCode = "en-IN",
    sttMode = "transcribe",
    disableSideEffects = false,
    maxTokens = 400,
}: UseVoiceAgentProps) {
    const [agentState, setAgentState] = useState<AgentState>("idle");
    const [messages, setMessages] = useState<ChatMessage[]>([{ role: "system", content: systemPrompt }]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<VoiceAgentMetrics>({
        lastTranscriptionMs: null,
        lastResponseMs: null,
        lastSpeechStartMs: null,
        lastTurnMs: null,
    });

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
    const startListeningRef = useRef<() => Promise<void> | void>(() => {});

    // Audio playback queue — for sentence-streaming
    const audioQueueRef = useRef<string[]>([]); // queue of base64 audio strings
    const isPlayingRef = useRef(false);
    const isPipelineActiveRef = useRef(false); // tracks if pipeline is still running
    const turnStartedAtRef = useRef<number | null>(null);
    const lastStageStartedAtRef = useRef<number | null>(null);
    const hasCapturedSpeechStartRef = useRef(false);

    // TTS serialization chain — ensures TTS calls fire ONE AT A TIME in order
    // This prevents concurrent Sarvam requests from resolving out-of-order
    const ttsChainRef = useRef<Promise<void>>(Promise.resolve());

    // Tracks if a proper log_call_data row has been written for this session
    // Prevents the safety-net from writing a duplicate empty row
    const hasLoggedRef = useRef(false);

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
                    setTimeout(() => startListeningRef.current(), 500);
                }
            } else {
                // Pipeline still streaming — wait for more audio
                isPlayingRef.current = false;
            }
            return;
        }

        isPlayingRef.current = true;
        setAgentState("speaking");
        if (!hasCapturedSpeechStartRef.current && turnStartedAtRef.current) {
            hasCapturedSpeechStartRef.current = true;
            setMetrics(prev => ({
                ...prev,
                lastSpeechStartMs: Math.round(performance.now() - turnStartedAtRef.current!),
            }));
        }
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
                const audioData = await getSarvamTTS(sentence.trim(), {
                    speaker: voiceSpeaker,
                    pace: voicePace,
                    targetLanguageCode: voiceLanguageCode,
                });
                enqueueAudio(audioData);
            } catch (err) {
                console.error("TTS chunk error (skipping):", err);
            }
        });
        return ttsChainRef.current;
    }, [enqueueAudio, voiceLanguageCode, voicePace, voiceSpeaker]);

    const speakAssistantMessage = useCallback(async (message: string, addToHistory = true) => {
        if (!message.trim()) return;

        setErrorMsg(null);
        isPipelineActiveRef.current = false;
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        ttsChainRef.current = Promise.resolve();
        turnStartedAtRef.current = performance.now();
        hasCapturedSpeechStartRef.current = false;

        if (currentAudio.current) {
            currentAudio.current.pause();
            currentAudio.current.currentTime = 0;
        }

        if (addToHistory) {
            const updatedMessages: ChatMessage[] = [
                ...messagesRef.current,
                { role: "assistant", content: message.trim() },
            ];
            setMessages(updatedMessages);
            messagesRef.current = updatedMessages;
        }

        setAgentState("thinking");
        await speakSentence(message);
        await ttsChainRef.current;
    }, [speakSentence]);

    // ── Main Pipeline ────────────────────────────────────────────────────────
    const handlePipeline = useCallback(async (audioBlob: Blob) => {
        setAgentState("thinking");
        isPipelineActiveRef.current = true;
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        turnStartedAtRef.current = performance.now();
        hasCapturedSpeechStartRef.current = false;
        // Reset the TTS chain so a fresh call sequence starts
        ttsChainRef.current = Promise.resolve();

        try {
            // STEP 1: STT — skip tiny/silent blobs to avoid Sarvam 429s
            // Blobs under 4KB are almost certainly silence or noise
            if (audioBlob.size < 4096) {
                setAgentState("idle");
                isPipelineActiveRef.current = false;
                if (isContinuous) setTimeout(() => startListeningRef.current(), 400);
                return;
            }

            lastStageStartedAtRef.current = performance.now();
            const transcribedText = await getSarvamSTT(audioBlob, { mode: sttMode });
            setMetrics(prev => ({
                ...prev,
                lastTranscriptionMs: lastStageStartedAtRef.current
                    ? Math.round(performance.now() - lastStageStartedAtRef.current)
                    : prev.lastTranscriptionMs,
            }));
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

            // ── History Trimming ──────────────────────────────────────────
            // Keep only system prompt + last 8 messages to cap token usage.
            // This prevents hitting Groq's 6-15K TPM limit on long conversations.
            const MAX_HISTORY_MESSAGES = 8;
            const systemMsg = updatedWithUser.find(m => m.role === "system");
            const nonSystemMsgs = updatedWithUser.filter(m => m.role !== "system");
            const trimmedMsgs = nonSystemMsgs.slice(-MAX_HISTORY_MESSAGES);
            const currentHistory: ChatMessage[] = systemMsg ? [systemMsg, ...trimmedMsgs] : trimmedMsgs;

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

                // Back to llama-3.3-70b-versatile
                const modelId = cloudModel ?? (isGroq ? "llama-3.3-70b-versatile" : "grok-3-mini");

                lastStageStartedAtRef.current = performance.now();
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: currentHistory,
                        temperature: 0.65,
                        stream: true,
                        max_tokens: maxTokens, // Voice responses should be short — caps token usage
                    }),
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    const errMsg = errData.error?.message || "Unknown";
                    // ── Auto-fallback to Gemini on Groq 429 or 400 ────────────
                    const isBackoff = response.status === 429 || response.status === 400;
                    if (isBackoff && import.meta.env.VITE_GEMINI_API_KEY) {
                        console.warn("Groq error (backoff). Auto-falling back to Gemini Flash...");
                        const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
                        lastStageStartedAtRef.current = performance.now();
                        const gemRes = await fetch(`/gemini-api/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                system_instruction: { parts: [{ text: systemMsg?.content || "" }] },
                                contents: trimmedMsgs
                                    .map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
                                generationConfig: { temperature: 0.65, maxOutputTokens: maxTokens },
                            }),
                        });
                        if (gemRes.ok) {
                            const gemData = await gemRes.json();
                            setMetrics(prev => ({
                                ...prev,
                                lastResponseMs: lastStageStartedAtRef.current
                                    ? Math.round(performance.now() - lastStageStartedAtRef.current)
                                    : prev.lastResponseMs,
                            }));
                            fullResponse = gemData.candidates[0].content.parts[0].text;
                            const { sentences, remainder } = splitIntoSentences(fullResponse);
                            const allChunks = remainder.trim() ? [...sentences, remainder.trim()] : sentences;
                            for (const chunk of allChunks) {
                                const clean = chunk.replace(TAG_STRIP_REGEX, "").trim();
                                if (clean) await speakSentence(clean);
                            }
                            // Jump straight to action parsing
                        } else {
                            throw new Error(`Groq error AND Gemini fallback failed: ${gemRes.status}`);
                        }
                    } else {
                        throw new Error(`${isGroq ? "Groq" : "xAI"} API Error: ${response.status} - ${errMsg}`);
                    }
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

                            if (fullResponse.length === 0 && lastStageStartedAtRef.current) {
                                setMetrics(prev => ({
                                    ...prev,
                                    lastResponseMs: Math.round(performance.now() - lastStageStartedAtRef.current!),
                                }));
                            }

                            fullResponse += token;
                            streamBuffer += token;

                            // Check if we have any complete sentences in the buffer
                            const { sentences, remainder } = splitIntoSentences(streamBuffer);
                            if (sentences.length > 0) {
                                streamBuffer = remainder;
                                for (const sentence of sentences) {
                                    // Strip [[...]] tags BEFORE TTS — AI must not speak them aloud
                                    const cleanSentence = sentence.replace(TAG_STRIP_REGEX, "").trim();
                                    if (cleanSentence) speakSentence(cleanSentence);
                                }
                            }
                        } catch {
                            // Malformed SSE chunk — skip
                        }
                    }
                }

                // Flush any remaining buffer after stream ends
                if (streamBuffer.trim()) {
                    const cleanRemainder = streamBuffer.trim().replace(TAG_STRIP_REGEX, "").trim();
                    if (cleanRemainder) speakSentence(cleanRemainder);
                }

                // Wait for ALL TTS chain calls to finish enqueuing
                await ttsChainRef.current;

            } else if (useCloudLLM && llmProvider === "gemini") {
                // ── NON-STREAMING PATH (Gemini) ──────────────────────────
                const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
                if (!geminiKey) throw new Error("Gemini API Key missing (VITE_GEMINI_API_KEY)");

                lastStageStartedAtRef.current = performance.now();
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
                        generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
                    }),
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(`Gemini API Error: ${response.status} - ${errData.error?.message || "Unknown"}`);
                }

                const data = await response.json();
                setMetrics(prev => ({
                    ...prev,
                    lastResponseMs: lastStageStartedAtRef.current
                        ? Math.round(performance.now() - lastStageStartedAtRef.current)
                        : prev.lastResponseMs,
                }));
                fullResponse = data.candidates[0].content.parts[0].text;

                // Sentence-split the full response, strip tags, then TTS in order
                const { sentences, remainder } = splitIntoSentences(fullResponse);
                const allChunks = remainder.trim() ? [...sentences, remainder.trim()] : sentences;
                for (const chunk of allChunks) {
                    const cleanChunk = chunk.replace(TAG_STRIP_REGEX, "").trim();
                    if (cleanChunk) await speakSentence(cleanChunk);
                }

            } else {
                // ── LOCAL OLLAMA ─────────────────────────────────────────
                lastStageStartedAtRef.current = performance.now();
                const response = await fetch("http://localhost:11434/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ model, messages: currentHistory, stream: false }),
                });
                if (!response.ok) throw new Error("Local Ollama connection failed. Is it running?");
                const data = await response.json();
                setMetrics(prev => ({
                    ...prev,
                    lastResponseMs: lastStageStartedAtRef.current
                        ? Math.round(performance.now() - lastStageStartedAtRef.current)
                        : prev.lastResponseMs,
                }));
                fullResponse = data.message.content;

                const { sentences, remainder } = splitIntoSentences(fullResponse);
                const allChunks = remainder.trim() ? [...sentences, remainder.trim()] : sentences;
                for (const chunk of allChunks) {
                    const cleanChunk = chunk.replace(TAG_STRIP_REGEX, "").trim();
                    if (cleanChunk) await speakSentence(cleanChunk);
                }
            }

            // STEP 3: Action Parsing
            // Strip [[ACTION:...]] tags from the response and execute side effects.
            // IMPORTANT: check_calendar_availability and transfer_call do NOT write rows.
            // Only log_call_data and book_appointment should persist to the sheet.
            let cleanResponse = fullResponse;
            cleanResponse = cleanResponse.replace(/\[\[.*?\]\]/gs, "").trim();

            if (!disableSideEffects) {
                const actionRegex = /\[\[ACTION:\s*(\w+)\s*\|(.*?)\]\]/gs;
                let match;

                while ((match = actionRegex.exec(fullResponse)) !== null) {
                    const actionType = match[1];
                    const actionParamsStr = match[2];
                    const params: any = {};
                    actionParamsStr.split("|").forEach(part => {
                        const [key, ...rest] = part.split(":").map(s => s.trim());
                        if (key && rest.length) params[key] = rest.join(":").trim();
                    });

                    console.log(`Action: ${actionType}`, params);

                    if (actionType === 'book_appointment' && !params.confirmation_code) {
                        params.confirmation_code = Math.floor(100000 + Math.random() * 900000).toString();
                    }

                    const sheetActions = ['log_call_data', 'LOG_CALL'];
                    const bridgeUrl = import.meta.env.VITE_GOOGLE_BRIDGE_URL;

                    if (bridgeUrl && sheetActions.includes(actionType)) {
                        const transcript = messagesRef.current
                            .filter(m => m.role !== 'system')
                            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
                            .join('\n\n');

                        if (params.phone_number || params.mobile) {
                            const raw = params.phone_number || params.mobile;
                            params.phone_number = raw.replace(/[^\d+]/g, '');
                        }

                        void postBridgeJson(bridgeUrl, buildBridgePayload(actionType, {
                            businessName,
                            spreadsheetId: businessSheetId,
                            sheetName: businessSheetTabName,
                        }, {
                            data: params,
                            transcript,
                        })).catch(err => console.error("Bridge Error:", err));

                        hasLoggedRef.current = true;
                    }

                    if (actionType === 'transfer_call') {
                        setErrorMsg("Connecting you with our team...");
                    }
                }
            }

            // STEP 4: Update message history with clean response
            const finalMessages: ChatMessage[] = [
                ...messagesRef.current,
                { role: "assistant", content: cleanResponse.trim() },
            ];
            setMessages(finalMessages);
            messagesRef.current = finalMessages;
            setMetrics(prev => ({
                ...prev,
                lastTurnMs: turnStartedAtRef.current
                    ? Math.round(performance.now() - turnStartedAtRef.current)
                    : prev.lastTurnMs,
            }));

            // Signal that the pipeline is done — playNextInQueue will handle state
            isPipelineActiveRef.current = false;
            // If nothing is playing yet, trigger idle/restart
            if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
                setAgentState("idle");
                if (isContinuous) {
                    setTimeout(() => startListeningRef.current(), 500);
                }
            }

        } catch (err: any) {
            console.error("Pipeline Error:", err);
            isPipelineActiveRef.current = false;
            setErrorMsg(err.message || "An error occurred.");
            setAgentState("error");
        }
    }, [
        businessName,
        cloudModel,
        disableSideEffects,
        isContinuous,
        llmProvider,
        maxTokens,
        model,
        speakSentence,
        sttMode,
        systemPrompt,
        useCloudLLM,
    ]);

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
    }, [agentState, handlePipeline, stopMic]);

    useEffect(() => {
        startListeningRef.current = startListening;
    }, [startListening]);

    const stopAgent = useCallback(() => {
        // ── Safety Net ── only fires when no proper log was written yet ──────
        // Requires at least 4 messages (≥2 user turns) to be a real conversation
        const bridgeUrl = import.meta.env.VITE_GOOGLE_BRIDGE_URL;
        const allMsgs = messagesRef.current.filter(m => m.role !== 'system');
        if (!disableSideEffects && bridgeUrl && !hasLoggedRef.current && allMsgs.length >= 4) {
            const transcript = allMsgs.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
            const fullText = allMsgs.map(m => m.content).join(' ');

            // Extract patient info from conversation text
            const nameMatch = fullText.match(/(?:Great|Perfect|Alright|Thanks)[,!]?\s+([A-Z][a-z]+)/);
            const phoneMatch = fullText.match(/(\+?[0-9]{10,13})/);
            const reasonMatch = fullText.match(/(?:root canal|cleaning|filling|braces|implant|consultation|whitening|cosmetic|extraction|toothache|tooth pain|cavity)/i);

            void postBridgeJson(bridgeUrl, buildBridgePayload("LOG_CALL", {
                businessName,
                spreadsheetId: businessSheetId,
                sheetName: businessSheetTabName,
            }, {
                data: {
                    session_uid: "AUTO_LOG_INCOMPLETE",
                    patient_name: nameMatch?.[1] || null,
                    phone_number: phoneMatch?.[1] || null,
                    service_reason: reasonMatch?.[0] || null,
                },
                transcript,
            })).catch(() => { });
        }
        // Reset for next session
        hasLoggedRef.current = false;

        stopMic();
        isPipelineActiveRef.current = false;
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        turnStartedAtRef.current = null;
        if (currentAudio.current) {
            currentAudio.current.pause();
            currentAudio.current.currentTime = 0;
        }
        setAgentState("idle");
    }, [businessName, businessSheetId, businessSheetTabName, disableSideEffects, stopMic]);

    const clearHistory = useCallback(() => {
        const resetMessages: ChatMessage[] = [{ role: "system", content: systemPrompt }];
        setMessages(resetMessages);
        messagesRef.current = resetMessages;
        hasLoggedRef.current = false; // Reset log tracker for new session
        setAgentState("idle");
        setErrorMsg(null);
        turnStartedAtRef.current = null;
        setMetrics({
            lastTranscriptionMs: null,
            lastResponseMs: null,
            lastSpeechStartMs: null,
            lastTurnMs: null,
        });
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
        metrics,
        startListening,
        stopListening: stopMic,
        speakAssistantMessage,
        stopAgent,
        clearHistory,
    };
}
