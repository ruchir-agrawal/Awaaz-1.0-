interface SarvamSTTOptions {
    mode?: "transcribe" | "translate" | "verbatim" | "translit" | "codemix";
}

const ttsCache = new Map<string, Promise<string>>();
const backendUrl = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(",")[1] || "";
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export async function getSarvamSTT(audioBlob: Blob, options: SarvamSTTOptions = {}): Promise<string> {
    const { mode = "transcribe" } = options;

    // 1. Try Backend Proxy if available
    try {
        const audioBase64 = await blobToBase64(audioBlob);
        const proxyEndpoint = backendUrl ? `${backendUrl}/api/voice/stt` : "/api/voice/stt";
        const proxyRes = await fetch(proxyEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64, mode }),
        });

        if (proxyRes.ok) {
            const data = await proxyRes.json();
            if (data?.transcript !== undefined) {
                return data.transcript;
            }
        }
    } catch (proxyErr) {
        // Fallback to direct client API if backend proxy fails or is offline
        console.debug("Backend STT proxy unavailable, falling back to direct:", proxyErr);
    }

    // 2. Direct Sarvam API Fallback
    const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
    if (!apiKey) {
        throw new Error("Sarvam API is unreachable and no client key is configured.");
    }

    const formData = new FormData();
    formData.append("model", "saaras:v3");
    formData.append("file", audioBlob, "audio.wav");
    formData.append("mode", mode);

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
        method: "POST",
        headers: {
            "api-subscription-key": apiKey,
        },
        body: formData,
    });

    if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const msg = errJson.message || errJson.error?.message || response.statusText;
        throw new Error(`Sarvam STT Failed (${response.status}): ${msg}`);
    }

    const data = await response.json();
    return data.transcript || "";
}

interface SarvamTTSOptions {
    speaker?: string;
    pace?: number;
    targetLanguageCode?: string;
}

export async function getSarvamTTS(text: string, options: SarvamTTSOptions = {}): Promise<string> {
    const {
        speaker = "shubh",
        pace = 1.1,
        targetLanguageCode = "en-IN",
    } = options;

    const cacheKey = JSON.stringify({
        text,
        speaker,
        pace,
        targetLanguageCode,
    });

    const existing = ttsCache.get(cacheKey);
    if (existing) {
        return existing;
    }

    const request = (async () => {
        // 1. Try Backend Proxy if available
        try {
            const proxyEndpoint = backendUrl ? `${backendUrl}/api/voice/tts` : "/api/voice/tts";
            const proxyRes = await fetch(proxyEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, speaker, pace, targetLanguageCode }),
            });

            if (proxyRes.ok) {
                const data = await proxyRes.json();
                if (data?.audioBase64) {
                    return data.audioBase64;
                }
            }
        } catch (proxyErr) {
            console.debug("Backend TTS proxy unavailable, falling back to direct:", proxyErr);
        }

        // 2. Direct Sarvam API Fallback
        const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
        if (!apiKey) {
            throw new Error("Sarvam TTS is unreachable and no client key is configured.");
        }

        const response = await fetch("https://api.sarvam.ai/text-to-speech", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-subscription-key": apiKey,
            },
            body: JSON.stringify({
                inputs: [text],
                target_language_code: targetLanguageCode,
                speaker,
                pace,
                speech_sample_rate: 16000,
                enable_preprocessing: true,
                model: "bulbul:v3",
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Sarvam TTS Failed: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        if (data && data.audios && data.audios.length > 0) {
            return data.audios[0];
        }
        throw new Error("No audio returned from Sarvam TTS");
    })().catch((error) => {
        ttsCache.delete(cacheKey);
        console.error("Sarvam TTS Error:", error);
        throw error;
    });

    ttsCache.set(cacheKey, request);
    return request;
}

export function prefetchSarvamTTS(text: string, options: SarvamTTSOptions = {}) {
    void getSarvamTTS(text, options).catch(() => {});
}
