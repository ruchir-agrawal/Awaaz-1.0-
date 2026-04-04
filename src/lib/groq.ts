export type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export async function getGroqResponse(messages: ChatMessage[], model: string = "llama-3.3-70b-versatile"): Promise<string> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("Groq API Key (VITE_GROQ_API_KEY) is missing in .env.local");
    }

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
                temperature: 0.7,
                max_tokens: 512
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Groq Error: ${err.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq API Error:", error);
        throw error;
    }
}
