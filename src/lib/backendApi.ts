const backendBaseUrl = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

export function backendUrl(path: string) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${backendBaseUrl}${normalizedPath}`;
}

export async function postBackendJson<T>(path: string, payload: unknown): Promise<T> {
    const response = await fetch(backendUrl(path), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const message = await response.text().catch(() => response.statusText);
        throw new Error(message || `Backend request failed with HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
}
