export interface VoiceModel {
    id: string
    name: string
    description: string
    image: string
}

/* Generates a subtle monochrome avatar SVG matching the landing's dark theme */
function createVoiceArt(hue: number, lightness: number) {
    const bg = `hsl(${hue},${Math.round(lightness * 0.28)}%,${Math.round(lightness * 0.12)}%)`
    const sphere = `hsl(${hue},${Math.round(lightness * 0.35)}%,${Math.round(lightness * 0.55)}%)`
    const accent = `hsl(${hue},${Math.round(lightness * 0.60)}%,${Math.round(lightness * 0.82)}%)`

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none">
      <defs>
        <radialGradient id="bg" cx="40%" cy="36%" r="70%">
          <stop stop-color="${sphere}" stop-opacity="0.9"/>
          <stop offset="1" stop-color="${bg}" stop-opacity="1"/>
        </radialGradient>
        <radialGradient id="shine" cx="30%" cy="28%" r="55%">
          <stop stop-color="rgba(255,255,255,0.28)"/>
          <stop offset="1" stop-color="rgba(255,255,255,0)"/>
        </radialGradient>
      </defs>
      <rect width="96" height="96" rx="28" fill="${bg}"/>
      <circle cx="48" cy="48" r="34" fill="url(#bg)"/>
      <circle cx="48" cy="48" r="34" fill="url(#shine)"/>
      <circle cx="64" cy="30" r="7" fill="${accent}" fill-opacity="0.75"/>
      <circle cx="48" cy="38" r="14" fill="rgba(255,255,255,0.88)"/>
      <path d="M35 67c3-10 7-17 13-17s10 7 13 17" stroke="rgba(255,255,255,0.80)" stroke-width="5" stroke-linecap="round"/>
    </svg>`

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const DEFAULT_VOICES: VoiceModel[] = [
    {
        id: "shubh",
        name: "Shubh",
        description: "Confident premium front desk",
        image: createVoiceArt(38, 88),   /* warm amber */
    },
    {
        id: "ritu",
        name: "Ritu",
        description: "Warm and reassuring clinic tone",
        image: createVoiceArt(330, 80),  /* rose */
    },
    {
        id: "aditya",
        name: "Aditya",
        description: "Fast, clear and sales-friendly",
        image: createVoiceArt(212, 90),  /* sapphire */
    },
    {
        id: "simran",
        name: "Simran",
        description: "Elegant bilingual hospitality feel",
        image: createVoiceArt(168, 85),  /* teal */
    },
]
