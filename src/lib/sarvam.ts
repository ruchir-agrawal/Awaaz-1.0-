interface SarvamSTTOptions {
    mode?: "transcribe" | "translate" | "verbatim" | "translit" | "codemix";
}

const ttsCache = new Map<string, Promise<string>>();

export async function getSarvamSTT(audioBlob: Blob, options: SarvamSTTOptions = {}): Promise<string> {
    const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
    if (!apiKey) {
        throw new Error("Sarvam API Key is missing");
    }

    const { mode = "transcribe" } = options;

    const formData = new FormData();
    formData.append('model', 'saaras:v3'); // Recommended v3 model
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('mode', mode); // Required for saaras:v3 transcription
    // Some endpoints might require language_code, defaulting to 'hi-IN' but model usually detects it
    // formData.append('language_code', 'hi-IN'); 

    console.log("Sarvam STT Request (v3):", {
        model: 'saaras:v3',
        mode,
        blobSize: audioBlob.size,
        blobType: audioBlob.type
    });

    try {
        const response = await fetch('https://api.sarvam.ai/speech-to-text', {
            method: 'POST',
            headers: {
                'api-subscription-key': apiKey,
                // Do NOT set Content-Type to multipart/form-data manually, fetch handles the boundary
            },
            body: formData
        });

        if (!response.ok) {
            const errJson = await response.json();
            console.error("Sarvam STT Error Payload:", errJson);
            // The error might be in the 'message' or 'error.message'
            const msg = errJson.message || errJson.error?.message || JSON.stringify(errJson);
            throw new Error(`Sarvam STT Failed (${response.status}): ${msg}`);
        }

        const data = await response.json();
        return data.transcript || "";
    } catch (error) {
        console.error("Sarvam STT Exception:", error);
        throw error;
    }
}

interface SarvamTTSOptions {
    speaker?: string;
    pace?: number;
    targetLanguageCode?: string;
}

export async function getSarvamTTS(text: string, options: SarvamTTSOptions = {}): Promise<string> {
    const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
    if (!apiKey) {
        throw new Error("Sarvam API Key is missing");
    }

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
        const response = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': apiKey
            },
            body: JSON.stringify({
                inputs: [text],
                // en-IN keeps English numbers natural while still allowing Hinglish code-switching.
                target_language_code: targetLanguageCode,
                speaker,
                pace,
                speech_sample_rate: 16000,
                enable_preprocessing: true, // enable_preprocessing=true helps with numbers/abbreviations
                model: "bulbul:v3"
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Sarvam TTS Failed: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        // Sarvam usually returns a base64 encoded string of the audio in the audios array
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
