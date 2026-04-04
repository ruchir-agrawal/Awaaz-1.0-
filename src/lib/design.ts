/**
 * Awaaz Design System — Indian Sovereign Theme
 * 
 * Color palette: Deep charcoal + warm amber gold + terracotta accents
 * Typography: Instrument Serif (italic display) + Space Grotesk (functional)
 * Motif: Mughal geometric patterns, jaali-inspired borders
 */

export const DS = {
  // Core colors (use inline styles or className references)
  bg: {
    base: "#080808",
    surface: "#0f0f0f",
    elevated: "#151515",
    overlay: "#1a1a1a",
  },
  text: {
    primary: "#f0ede8",     // warm off-white
    secondary: "rgba(240,237,232,0.45)",
    muted: "rgba(240,237,232,0.2)",
    ghost: "rgba(240,237,232,0.08)",
  },
  accent: {
    gold: "#c9a227",        // Indian gold / Mughal amber
    goldLight: "#e8c547",
    goldMuted: "rgba(201,162,39,0.15)",
    goldBorder: "rgba(201,162,39,0.2)",
    terra: "#c4643a",       // terracotta
    terraMuted: "rgba(196,100,58,0.15)",
  },
  border: {
    default: "rgba(255,255,255,0.06)",
    accent: "rgba(201,162,39,0.2)",
    subtle: "rgba(255,255,255,0.04)",
  },
  status: {
    success: "#5c9e6e",
    warning: "#c9a227",
    error: "#c4643a",
    info: "#4a7fa5",
  }
} as const

// Font helpers as inline style objects
export const fonts = {
  serif: { fontFamily: "'Instrument Serif', serif" } as React.CSSProperties,
  serifItalic: { fontFamily: "'Instrument Serif', serif", fontStyle: "italic" } as React.CSSProperties,
  sans: { fontFamily: "'Space Grotesk', sans-serif" } as React.CSSProperties,
}
