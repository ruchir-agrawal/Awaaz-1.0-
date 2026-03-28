export async function getSarvamSTT(audioBlob: Blob): Promise<string> {
    const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
    if (!apiKey) {
        throw new Error("Sarvam API Key is missing");
    }

    const formData = new FormData();
    formData.append('model', 'saaras:v3'); // Recommended v3 model
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('mode', 'transcribe'); // Required for saaras:v3 transcription
    // Some endpoints might require language_code, defaulting to 'hi-IN' but model usually detects it
    // formData.append('language_code', 'hi-IN'); 

    console.log("Sarvam STT Request (v3):", {
        model: 'saaras:v3',
        mode: 'transcribe',
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

export async function getSarvamTTS(text: string): Promise<string> {
    const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
    if (!apiKey) {
        throw new Error("Sarvam API Key is missing");
    }

    try {
        const response = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': apiKey
            },
            body: JSON.stringify({
                inputs: [text],
                target_language_code: "hi-IN", // or en-IN
                speaker: "shubh",
                pace: 1.10,
                speech_sample_rate: 16000,
                enable_preprocessing: false,
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
    } catch (error) {
        console.error("Sarvam TTS Error:", error);
        throw error;
    }
}
