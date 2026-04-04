export type ChatMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export async function getOllamaResponse(messages: ChatMessage[], model: string = "gemma2"): Promise<string> {
    try {
        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Ollama Failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.message?.content || "";
    } catch (error) {
        console.error("Ollama API Error:", error);
        throw error;
    }
}
