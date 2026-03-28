import { useState, useRef, useCallback, useEffect } from "react";
import { getSarvamSTT, getSarvamTTS } from "@/lib/sarvam";
import { type ChatMessage } from "@/lib/ollama";

export type AgentState = "idle" | "listening" | "thinking" | "speaking" | "error";

interface UseVoiceAgentProps {
    systemPrompt: string;
    model?: string;
    useCloudLLM?: boolean;
    isContinuous?: boolean;
    llmProvider?: "groq" | "ollama" | "xai" | "gemini";
}

export function useVoiceAgent({ systemPrompt, model = "qwen2.5:7b", useCloudLLM = true, isContinuous = false, llmProvider = "groq" }: UseVoiceAgentProps) {
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

    // VAD Parameters
    const SILENCE_THRESHOLD = -45; // dB
    const SILENCE_DURATION = 800; // ms (Balanced for stability and speed)

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

            // Ensure previous context is cleaned up
            if (audioContextRef.current) {
                await audioContextRef.current.close().catch(() => { });
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Set up VAD
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

    const handlePipeline = async (audioBlob: Blob) => {
        setAgentState("thinking");
        try {
            // STEP 1: STT
            const transcibedText = await getSarvamSTT(audioBlob);
            if (!transcibedText.trim()) {
                setAgentState("idle");
                return;
            }

            const userMessage: ChatMessage = { role: "user", content: transcibedText };

            // Immediately update state and ref to show user message
            const updatedWithUser: ChatMessage[] = [...messagesRef.current, userMessage];
            setMessages(updatedWithUser);
            messagesRef.current = updatedWithUser;

            // STEP 2: LLM (xAI Grok, Groq, or Ollama)
            let llmResponse = "";
            const currentHistory = updatedWithUser;

            if (useCloudLLM) {
                if (llmProvider === "xai") {
                    const xaiKey = import.meta.env.VITE_XAI_API_KEY;
                    if (!xaiKey) throw new Error("xAI API Key missing (VITE_XAI_API_KEY)");

                    const response = await fetch("/xai-api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${xaiKey}`
                        },
                        body: JSON.stringify({
                            model: "grok-3-mini",
                            messages: currentHistory,
                            temperature: 0.7,
                            stream: false
                        })
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error("xAI Error Detail:", errorData);
                        let msg = errorData.error?.message || 'Unknown error';
                        if (response.status === 400 && msg.includes("credits")) {
                            msg = "No xAI credits available. Please add funds to your xAI account.";
                        }
                        throw new Error(`xAI API Error: ${response.status} - ${msg}`);
                    }
                    const data = await response.json();
                    llmResponse = data.choices[0].message.content;
                } else if (llmProvider === "gemini") {
                    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
                    if (!geminiKey) throw new Error("Gemini API Key missing (VITE_GEMINI_API_KEY)");

                    const response = await fetch(`/gemini-api/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            system_instruction: {
                                parts: { text: systemPrompt }
                            },
                            contents: currentHistory
                                .filter(m => m.role !== "system")
                                .map(m => ({
                                    role: m.role === "assistant" ? "model" : "user",
                                    parts: [{ text: m.content }]
                                })),
                            generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 500,
                            }
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error("Gemini Error Detail:", errorData);
                        throw new Error(`Gemini API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
                    }

                    const data = await response.json();
                    llmResponse = data.candidates[0].content.parts[0].text;
                } else {
                    // Default to Groq
                    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
                    if (!groqKey) throw new Error("Groq API Key missing");

                    const response = await fetch("/groq-api/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${groqKey}`
                        },
                        body: JSON.stringify({
                            model: "llama-3.3-70b-versatile",
                            messages: currentHistory,
                        })
                    });
                    if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);
                    const data = await response.json();
                    llmResponse = data.choices[0].message.content;
                }
            } else {
                // Local Ollama
                const response = await fetch("http://localhost:11434/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: model,
                        messages: currentHistory,
                        stream: false
                    })
                });
                if (!response.ok) throw new Error("Local Ollama connection failed. Is it running?");
                const data = await response.json();
                llmResponse = data.message.content;
            }

            const finalMessages: ChatMessage[] = [...messagesRef.current, { role: "assistant", content: llmResponse }];
            setMessages(finalMessages);
            messagesRef.current = finalMessages;

            // STEP 3: ACTION PARSING (Google Bridge)
            // Look for patterns like [[ACTION: log_call | name: ... | phone: ...]]
            const actionRegex = /\[\[ACTION:\s*(\w+)\s*\|(.*?)\]\]/g;
            let match;
            let cleanResponse = llmResponse;

            while ((match = actionRegex.exec(llmResponse)) !== null) {
                const actionType = match[1];
                const actionParamsStr = match[2];
                const params: any = {};

                actionParamsStr.split('|').forEach(part => {
                    const [key, val] = part.split(':').map(s => s.trim());
                    if (key && val) params[key] = val;
                });

                console.log(`Triggering Google Action: ${actionType}`, params);

                // Fire and forget (don't block the UI/Voice for the log/book call)
                const bridgeUrl = import.meta.env.VITE_GOOGLE_BRIDGE_URL;
                if (bridgeUrl) {
                    fetch(bridgeUrl, {
                        method: 'POST',
                        mode: 'no-cors', // Apps Script requires no-cors if not handling preflight
                        body: JSON.stringify({
                            type: actionType,
                            data: params
                        })
                    }).catch(err => console.error("Google Bridge Error:", err));
                }

                // Remove the action tag from the text so TTS doesn't read it
                cleanResponse = cleanResponse.replace(match[0], '');
            }

            // STEP 4: TTS (Use cleaned text)
            const audioData = await getSarvamTTS(cleanResponse.trim());

            // STEP 5: Playback
            playAudioBase64(audioData);

        } catch (err: any) {
            console.error("Pipeline Error:", err);
            setErrorMsg(err.message || "An error occurred.");
            setAgentState("error");
        }
    };

    const playAudioBase64 = (base64Audio: string) => {
        setAgentState("speaking");
        try {
            const audioSrc = `data:audio/wav;base64,${base64Audio}`;
            currentAudio.current = new Audio(audioSrc);

            currentAudio.current.onended = () => {
                setAgentState("idle");
                // If continuous mode is on, auto-restart the mic!
                if (isContinuous) {
                    setTimeout(() => startListening(), 500);
                }
            };

            currentAudio.current.play().catch(e => {
                console.error("Audio playback failed:", e);
                setAgentState("error");
            });
        } catch (err: any) {
            setAgentState("error");
        }
    };

    const stopAgent = useCallback(() => {
        stopMic();
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

    // Update system prompt if it changes
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
        clearHistory
    };
}
