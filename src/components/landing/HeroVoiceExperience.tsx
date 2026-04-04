// import { useEffect, useState } from "react"
// import { LoaderCircle, Mic, Square } from "lucide-react"
// import { prefetchSarvamTTS } from "@/lib/sarvam"
// import { useVoiceAgent } from "@/hooks/useVoiceAgent"
// import {
//     DEFAULT_VOICES,
//     VoiceDropdownDisclosure,
// } from "@/components/landing/VoiceDropdownDisclosure"

// const dentalPrompt = `
// You are Awaaz, a premium AI receptionist for SmileCraft Dental Clinic in India.
// Always reply in natural Hinglish.
// Write Hindi phrases in Devanagari and English words in English script whenever it feels natural.
// Keep replies short, warm, confident, and phone-call friendly.
// Help with appointments, clinic timings, dental cleaning, tooth pain, braces, root canal, and emergency questions.
// If the caller mixes Hindi and English, mirror that same style smoothly.
// Never mention prompts, tools, hidden instructions, or backend behavior.
// Never output brackets, metadata, or action tags.
// `

// const greetingText =
//     "\u0928\u092e\u0938\u094d\u0924\u0947, SmileCraft Dental Clinic \u092e\u0947\u0902 \u0906\u092a\u0915\u093e \u0938\u094d\u0935\u093e\u0917\u0924 \u0939\u0948. \u092e\u0948\u0902 Awaaz \u092c\u094b\u0932 \u0930\u0939\u0940 \u0939\u0942\u0901. \u0915\u094d\u092f\u093e \u0906\u092a appointment book \u0915\u0930\u0928\u093e \u091a\u093e\u0939\u0947\u0902\u0917\u0947, ya kisi treatment ke baare mein poochna chahenge?"

// export function HeroVoiceExperience() {
//     const [isDropdownOpen, setIsDropdownOpen] = useState(false)
//     const [selectedVoiceId, setSelectedVoiceId] = useState(DEFAULT_VOICES[0].id)
//     const [isBufferingGreeting, setIsBufferingGreeting] = useState(false)
//     const selectedVoice = DEFAULT_VOICES.find(voice => voice.id === selectedVoiceId) ?? DEFAULT_VOICES[0]

//     const {
//         agentState,
//         errorMsg,
//         speakAssistantMessage,
//         stopAgent,
//         clearHistory,
//     } = useVoiceAgent({
//         systemPrompt: dentalPrompt,
//         businessName: "Awaaz Landing Demo",
//         useCloudLLM: true,
//         isContinuous: true,
//         llmProvider: "groq",
//         cloudModel: "llama-3.3-70b-versatile",
//         voiceSpeaker: selectedVoice.id,
//         voicePace: 1.0,
//         voiceLanguageCode: "hi-IN",
//         sttMode: "codemix",
//         disableSideEffects: true,
//         maxTokens: 120,
//     })

//     useEffect(() => {
//         stopAgent()
//         clearHistory()
//         prefetchSarvamTTS(greetingText, {
//             speaker: selectedVoice.id,
//             pace: 1.0,
//             targetLanguageCode: "hi-IN",
//         })
//     }, [clearHistory, selectedVoiceId, stopAgent, selectedVoice.id])

//     useEffect(() => {
//         if (
//             agentState === "speaking" ||
//             agentState === "listening" ||
//             agentState === "error" ||
//             agentState === "idle"
//         ) {
//             setIsBufferingGreeting(false)
//         }
//     }, [agentState])

//     const orbVisual =
//         isBufferingGreeting || agentState === "thinking"
//             ? "from-slate-200/70 via-white/30 to-slate-400/20 shadow-[0_0_90px_rgba(255,255,255,0.16)]"
//             : agentState === "listening"
//                 ? "from-emerald-300 via-emerald-500 to-green-700 shadow-[0_0_90px_rgba(16,185,129,0.28)]"
//                 : agentState === "speaking"
//                     ? "from-amber-200 via-amber-400 to-orange-700 shadow-[0_0_90px_rgba(251,191,36,0.30)]"
//                     : agentState === "error"
//                         ? "from-rose-300 via-rose-500 to-red-700 shadow-[0_0_80px_rgba(244,63,94,0.24)]"
//                         : "from-white/20 via-white/10 to-white/4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"

//     const handleStart = async () => {
//         if (agentState !== "idle") return
//         clearHistory()
//         setIsBufferingGreeting(true)
//         await speakAssistantMessage(greetingText, true)
//     }

//     const handleStop = () => {
//         setIsBufferingGreeting(false)
//         stopAgent()
//     }

//     const orbState =
//         isBufferingGreeting || agentState === "thinking"
//             ? "thinking"
//             : agentState === "listening"
//                 ? "listening"
//                 : agentState === "speaking"
//                     ? "speaking"
//                     : agentState === "error"
//                         ? "error"
//                         : "idle"

//     return (
//         <div className="w-full max-w-[58rem]">
//             <div className="grid gap-6 lg:grid-cols-[minmax(36rem,1fr)_18rem]">
//                 <div className="relative flex min-h-[44rem] items-center justify-center overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
//                     <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_30%),radial-gradient(circle_at_bottom,rgba(217,163,72,0.1),transparent_35%)]" />
//                     <div className="absolute h-[28rem] w-[28rem] rounded-full border border-white/5 animate-pulse" />
//                     {(isBufferingGreeting || agentState === "thinking" || agentState === "speaking" || agentState === "listening") && (
//                         <>
//                             <div className="absolute h-[19rem] w-[19rem] rounded-full border border-white/10 animate-ping" style={{ animationDuration: "2.5s" }} />
//                             <div className="absolute h-[23rem] w-[23rem] rounded-full border border-white/6 animate-ping" style={{ animationDuration: "3.1s" }} />
//                         </>
//                     )}

//                     <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/8 bg-black/30 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/40">
//                         <span className={`h-2 w-2 rounded-full ${isBufferingGreeting || agentState === "thinking" ? "bg-white/70" : agentState === "listening" ? "bg-emerald-400" : agentState === "speaking" ? "bg-amber-300" : "bg-white/20"}`} />
//                         {isBufferingGreeting || agentState === "thinking"
//                             ? "Warming up"
//                             : agentState === "listening"
//                                 ? "Listening"
//                                 : agentState === "speaking"
//                                     ? "Live"
//                                     : "Ready"}
//                     </div>

//                     <div className="relative z-10 flex flex-col items-center justify-center">
//                         <button
//                             type="button"
//                             onClick={handleStart}
//                             className={`agent-orb-shell relative flex h-60 w-60 items-center justify-center rounded-full bg-gradient-to-br transition-all duration-700 ${orbVisual}`}
//                             aria-label="Start voice experience"
//                             data-state={orbState}
//                         >
//                             <span className="agent-orb-core" />
//                             <span className="agent-orb-blob agent-orb-blob-a" />
//                             <span className="agent-orb-blob agent-orb-blob-b" />
//                             <span className="agent-orb-blob agent-orb-blob-c" />
//                             {(orbState === "speaking" || orbState === "listening") && <span className="agent-orb-ring" />}
//                             <span className="relative z-10">
//                                 {isBufferingGreeting || agentState === "thinking" ? (
//                                     <LoaderCircle className="h-14 w-14 animate-spin text-white" />
//                                 ) : (
//                                     <Mic className={`h-14 w-14 ${agentState === "idle" ? "text-white/75" : "text-white"}`} />
//                                 )}
//                             </span>
//                         </button>

//                         <div className="mt-8 text-center text-[13px] font-semibold uppercase tracking-[0.34em] text-white/38">
//                             Talk To Agent
//                         </div>

//                         <button
//                             type="button"
//                             onClick={handleStop}
//                             className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/65 transition hover:border-white/20 hover:text-white"
//                         >
//                             <Square className="h-3.5 w-3.5" />
//                             Stop Session
//                         </button>
//                     </div>

//                     {errorMsg && (
//                         <div className="absolute bottom-6 left-6 right-6 rounded-[1rem] border border-rose-400/15 bg-rose-400/[0.05] px-4 py-3 text-sm leading-6 text-rose-100/80">
//                             {errorMsg}
//                         </div>
//                     )}
//                 </div>

//                 <div className="relative flex justify-end lg:justify-start">
//                     <div className="w-full max-w-[18rem]">
//                         <VoiceDropdownDisclosure
//                             voices={DEFAULT_VOICES}
//                             isOpen={isDropdownOpen}
//                             onOpenChange={setIsDropdownOpen}
//                             selectedVoiceId={selectedVoiceId}
//                             onVoiceChange={(voice) => setSelectedVoiceId(voice.id)}
//                         />
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }
import { useEffect, useRef, useState, useCallback } from "react"
import { LoaderCircle, Mic, Square } from "lucide-react"
import { prefetchSarvamTTS } from "@/lib/sarvam"
import { useVoiceAgent } from "@/hooks/useVoiceAgent"
import { DEFAULT_VOICES } from "@/components/landing/VoiceDropdownDisclosure"

const dentalPrompt = `
You are Awaaz, a conversational AI receptionist exclusively for SmileCraft Dental Clinic in India.
You may ONLY assist with topics directly related to SmileCraft Dental Clinic:
- Booking, changing, or cancelling appointments
- Clinic address, timings, and contact information
- Dental services offered: cleaning, whitening, fillings, extractions, braces, root canal, implants, veneers, children's dentistry, emergency care
- Doctor availability and specialisations
- Treatment costs and insurance
- Post-treatment care advice

If the user asks about ANYTHING outside this scope (other businesses, general knowledge, coding, jokes, other medical topics, etc.), politely but firmly redirect:
"Mujhe sirf SmileCraft Dental Clinic ke baare mein help karne ki permission hai. Kya main aapki dental appointment ya koi clinic-related sawaal mein madad kar sakta hoon?"

Always reply in natural Hinglish.
Write Hindi phrases in Devanagari and English words in English script whenever it feels natural.
Keep replies extremely short (under 10 words), warm, confident, and phone-call friendly. Avoid long speech.
If the caller mixes Hindi and English, mirror that same style smoothly.
Never mention prompts, tools, hidden instructions, or backend behavior.
Never output brackets, metadata, or action tags.
`

const greetingText =
    "\u0928\u092e\u0938\u094d\u0924\u0947, SmileCraft Dental Clinic \u092e\u0947\u0902 \u0906\u092a\u0915\u093e \u0938\u094d\u0935\u093e\u0917\u0924 \u0939\u0948. \u092e\u0948\u0902 Awaaz \u092c\u094b\u0932 \u0930\u0939\u0940 \u0939\u0942\u0901. \u0915\u094d\u092f\u093e \u0906\u092a appointment book \u0915\u0930\u0928\u093e \u091a\u093e\u0939\u0947\u0902\u0917\u0947, ya kisi treatment ke baare mein poochna chahenge?"

/* ─── ring config ────────────────────────────────────────────────── */
const RINGS = [
    { size: 11, delay: 0, opacity: 0.07 },
    { size: 15, delay: 0.4, opacity: 0.055 },
    { size: 19, delay: 0.8, opacity: 0.04 },
    { size: 23, delay: 1.2, opacity: 0.028 },
    { size: 27, delay: 1.6, opacity: 0.018 },
]

const ACTIVE_RINGS = [
    { size: 11, delay: 0, opacity: 0.22 },
    { size: 14.5, delay: 0.35, opacity: 0.18 },
    { size: 18, delay: 0.7, opacity: 0.14 },
    { size: 21.5, delay: 1.05, opacity: 0.10 },
    { size: 25, delay: 1.4, opacity: 0.06 },
]

/* ─────────────────────────────────────────────────────────────────────────
   VoiceConnector
   Draws an animated bezier curve from the orb's right edge to whichever
   voice chip is currently selected.  It reads the chip directly from
   chipRefs (a Map that is populated on mount and stays stable) using the
   selectedVoiceId — this is the *only* reliable way to track which chip is
   active, because React ref-callbacks only fire on mount/unmount, not on
   prop changes.
───────────────────────────────────────────────────────────────────────── */
function VoiceConnector({
    orbRef,
    chipRefs,
    selectedVoiceId,
    color,
}: {
    orbRef: React.RefObject<HTMLButtonElement | null>
    chipRefs: React.RefObject<Map<string, HTMLButtonElement>>
    selectedVoiceId: string
    color: string
}) {
    const svgRef = useRef<SVGSVGElement>(null)
    const pathRef = useRef<SVGPathElement>(null)
    const [pathD, setPathD] = useState("")
    const [pathLen, setPathLen] = useState(0)

    const recalc = useCallback(() => {
        const orb = orbRef.current
        const target = chipRefs.current?.get(selectedVoiceId)
        const svg = svgRef.current
        if (!orb || !target || !svg) return

        const orbRect = orb.getBoundingClientRect()
        const tgtRect = target.getBoundingClientRect()
        const svgRect = svg.getBoundingClientRect()

        // Right-centre of orb → Left-centre of chip
        const x1 = orbRect.right - svgRect.left
        const y1 = orbRect.top + orbRect.height / 2 - svgRect.top
        const x2 = tgtRect.left - svgRect.left
        const y2 = tgtRect.top + tgtRect.height / 2 - svgRect.top

        const cx = (x1 + x2) / 2
        const d = `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`
        setPathD(d)

        requestAnimationFrame(() => {
            if (pathRef.current) setPathLen(pathRef.current.getTotalLength())
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orbRef, chipRefs, selectedVoiceId]) // ← selectedVoiceId triggers rerenders on voice switch

    // Rerun on mount, voice change, and window resize
    useEffect(() => {
        // Small delay to let layout settle after selectedVoiceId change
        const id = requestAnimationFrame(recalc)
        window.addEventListener("resize", recalc)
        return () => {
            cancelAnimationFrame(id)
            window.removeEventListener("resize", recalc)
        }
    }, [recalc])

    return (
        <svg
            ref={svgRef}
            className="pointer-events-none absolute inset-0 overflow-visible"
            style={{ width: "100%", height: "100%", zIndex: 5 }}
        >
            <defs>
                <linearGradient id="connLineH" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.15} />
                </linearGradient>
            </defs>

            {/* Smooth bezier line — CSS transition animates it between chip positions */}
            <path
                ref={pathRef}
                d={pathD || "M 0 0"}
                fill="none"
                stroke="url(#connLineH)"
                strokeWidth={1.5}
                strokeLinecap="round"
                style={{
                    transition: "d 0.55s cubic-bezier(0.34,1.2,0.64,1), opacity 0.3s ease",
                    opacity: pathD ? 1 : 0,
                    strokeDasharray: pathLen || 400,
                    strokeDashoffset: 0,
                }}
            />

            {/* Travelling dot — key on selectedVoiceId so animateMotion restarts cleanly */}
            {pathLen > 0 && pathD && (
                <circle
                    key={selectedVoiceId}
                    r={3.5}
                    fill={color}
                    opacity={0.8}
                    style={{ filter: "blur(0.6px)", transition: "fill 0.4s ease" }}
                >
                    <animateMotion
                        dur="1.1s"
                        begin="0s"
                        repeatCount="indefinite"
                        path={pathD}
                        calcMode="spline"
                        keyTimes="0;1"
                        keySplines="0.42 0 0.58 1"
                    />
                </circle>
            )}
        </svg>
    )
}

/* ─── State label ────────────────────────────────────────────────── */
function StateLabel({ state }: { state: string }) {
    const map: Record<string, { label: string; color: string }> = {
        thinking: { label: "Thinking…", color: "rgba(255,255,255,0.35)" },
        listening: { label: "Listening", color: "rgba(52,211,153,0.9)" },
        speaking: { label: "Speaking", color: "rgba(251,191,36,0.9)" },
        error: { label: "Error", color: "rgba(244,63,94,0.9)" },
    }
    const entry = map[state]
    if (!entry) return null
    const { label, color } = entry
    return (
        <div
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] font-semibold"
            style={{
                bottom: "2.4rem",
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(8px)",
                color,
                transition: "color 0.5s ease",
                whiteSpace: "nowrap",
                pointerEvents: "none",
            }}
        >
            <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                    background: color,
                    boxShadow: `0 0 6px ${color}`,
                    animation: "pulse 1.4s ease-in-out infinite",
                }}
            />
            {label}
        </div>
    )
}

/* ─── Main component ─────────────────────────────────────────────── */
export function HeroVoiceExperience() {
    const [selectedVoiceId, setSelectedVoiceId] = useState(DEFAULT_VOICES[0].id)
    const [hoveredVoiceId, setHoveredVoiceId] = useState<string | null>(null)
    const [isBufferingGreeting, setIsBufferingGreeting] = useState(false)

    const orbRef = useRef<HTMLButtonElement>(null)
    // chipRefs is a stable Map – entries are set on mount and never deleted
    // (buttons don't unmount on voice change), so it's always fully populated.
    const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

    const selectedVoice = DEFAULT_VOICES.find(v => v.id === selectedVoiceId) ?? DEFAULT_VOICES[0]

    const {
        agentState,
        errorMsg,
        speakAssistantMessage,
        stopAgent,
        clearHistory,
    } = useVoiceAgent({
        systemPrompt: dentalPrompt,
        businessName: "SmileCraft Dental — Demo",
        useCloudLLM: true,
        isContinuous: true,
        llmProvider: "groq",
        cloudModel: "llama-3.3-70b-versatile",
        voiceSpeaker: selectedVoice.id,
        voicePace: 1.0,
        voiceLanguageCode: "hi-IN",
        sttMode: "codemix",
    })

    useEffect(() => {
        stopAgent()
        clearHistory()
        prefetchSarvamTTS(greetingText, {
            speaker: selectedVoice.id,
            pace: 1.0,
            targetLanguageCode: "hi-IN",
        })
    }, [clearHistory, selectedVoiceId, stopAgent, selectedVoice.id])

    useEffect(() => {
        if (["speaking", "listening", "error", "idle"].includes(agentState)) {
            setIsBufferingGreeting(false)
        }
    }, [agentState])



    const orbState =
        isBufferingGreeting || agentState === "thinking" ? "thinking"
            : agentState === "listening" ? "listening"
                : agentState === "speaking" ? "speaking"
                    : agentState === "error" ? "error"
                        : "idle"

    const orbGrad =
        orbState === "thinking"
            ? "radial-gradient(circle at 38% 36%, rgba(255,255,255,0.55), rgba(255,255,255,0.10) 38%, rgba(120,120,140,0.14) 66%, transparent 85%)"
            : orbState === "listening"
                ? "radial-gradient(circle at 35% 33%, rgba(110,255,185,0.75), rgba(16,185,129,0.32) 42%, rgba(5,80,55,0.20) 70%, transparent 88%)"
                : orbState === "speaking"
                    ? "radial-gradient(circle at 35% 33%, rgba(255,230,100,0.80), rgba(245,158,11,0.38) 42%, rgba(120,60,10,0.22) 70%, transparent 88%)"
                    : orbState === "error"
                        ? "radial-gradient(circle at 35% 33%, rgba(255,140,140,0.75), rgba(244,63,94,0.30) 42%, rgba(100,10,30,0.20) 70%, transparent 88%)"
                        : "radial-gradient(circle at 38% 36%, rgba(255,255,255,0.22), rgba(255,255,255,0.07) 42%, rgba(200,170,100,0.07) 70%, transparent 88%)"

    const orbShadow =
        orbState === "thinking" ? "0 0 60px rgba(255,255,255,0.14), 0 0 120px rgba(255,255,255,0.06)"
            : orbState === "listening" ? "0 0 60px rgba(16,185,129,0.30),  0 0 120px rgba(16,185,129,0.12)"
                : orbState === "speaking" ? "0 0 60px rgba(245,158,11,0.35),  0 0 120px rgba(245,158,11,0.14)"
                    : orbState === "error" ? "0 0 60px rgba(244,63,94,0.28),   0 0 100px rgba(244,63,94,0.10)"
                        : "0 0 40px rgba(255,255,255,0.05)"

    const isActive = orbState !== "idle"
    const rings = isActive ? ACTIVE_RINGS : RINGS
    const ringColor =
        orbState === "listening" ? "rgba(52,211,153,1)"
            : orbState === "speaking" ? "rgba(251,191,36,1)"
                : orbState === "error" ? "rgba(244,63,94,1)"
                    : "rgba(255,255,255,1)"

    const connectorColor =
        orbState === "listening" ? "rgba(52,211,153,0.9)"
            : orbState === "speaking" ? "rgba(251,191,36,0.9)"
                : "rgba(255,255,255,0.50)"

    const handleStart = async () => {
        if (agentState !== "idle") return
        clearHistory()
        setIsBufferingGreeting(true)
        await speakAssistantMessage(greetingText, true)
    }

    const handleStop = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsBufferingGreeting(false)
        stopAgent()
    }

    const containerRef = useRef<HTMLDivElement>(null)

    return (
        <div
            ref={containerRef}
            className="relative flex flex-row items-center gap-8 w-full max-w-[58rem]"
        >
            {/* ── Connector SVG ─────────────────────────────────────────── */}
            <VoiceConnector
                orbRef={orbRef}
                chipRefs={chipRefs}
                selectedVoiceId={selectedVoiceId}
                color={connectorColor}
            />

            {/* ── Orb stage ─────────────────────────────────────────────── */}
            <div
                className="relative flex-shrink-0 flex items-center justify-center"
                style={{ width: "30rem", height: "30rem" }}
            >
                {rings.map((r, i) => (
                    <span
                        key={i}
                        className="absolute rounded-full"
                        style={{
                            width: `${r.size}rem`,
                            height: `${r.size}rem`,
                            border: `1px solid ${ringColor}`,
                            opacity: r.opacity,
                            animation: isActive
                                ? `heroRingPing 2.4s cubic-bezier(0.4,0,0.6,1) ${r.delay}s infinite`
                                : `heroRingBreath 5s ease-in-out ${r.delay * 0.6}s infinite`,
                            transition: "opacity 0.8s ease, border-color 0.6s ease",
                        }}
                    />
                ))}

                <button
                    ref={orbRef}
                    type="button"
                    onClick={handleStart}
                    disabled={orbState !== "idle"}
                    aria-label="Start voice experience"
                    data-state={orbState}
                    className="agent-orb-shell relative z-10 flex h-44 w-44 items-center justify-center rounded-full transition-all duration-700 cursor-pointer disabled:cursor-default"
                    style={{
                        background: orbGrad,
                        boxShadow: orbShadow,
                        border: "1px solid rgba(255,255,255,0.10)",
                    }}
                >
                    <span className="agent-orb-core" />
                    <span className="agent-orb-blob agent-orb-blob-a" />
                    <span className="agent-orb-blob agent-orb-blob-b" />
                    <span className="agent-orb-blob agent-orb-blob-c" />
                    {(orbState === "speaking" || orbState === "listening") && (
                        <span className="agent-orb-ring" />
                    )}
                    <span className="relative z-10">
                        {orbState === "thinking" ? (
                            <LoaderCircle className="h-11 w-11 animate-spin text-white/70" />
                        ) : (
                            <Mic
                                className="h-11 w-11 transition-all duration-500"
                                style={{
                                    color:
                                        orbState === "idle" ? "rgba(255,255,255,0.50)"
                                            : orbState === "listening" ? "rgba(52,211,153,1)"
                                                : orbState === "speaking" ? "rgba(251,191,36,1)"
                                                    : orbState === "error" ? "rgba(244,63,94,1)"
                                                        : "rgba(255,255,255,0.80)",
                                    filter: orbState !== "idle" ? "drop-shadow(0 0 8px currentColor)" : "none",
                                }}
                            />
                        )}
                    </span>
                </button>

                {orbState === "idle" && (
                    <div className="absolute bottom-9 left-1/2 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/25 pointer-events-none select-none">
                        Tap to start
                    </div>
                )}

                {orbState !== "idle" && (
                    <button
                        type="button"
                        onClick={handleStop}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-white/55 transition-all duration-200 hover:text-white/90 hover:scale-105 active:scale-95"
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.10)",
                            backdropFilter: "blur(12px)",
                        }}
                    >
                        <Square className="h-3.5 w-3.5" strokeWidth={2.5} />
                        End call
                    </button>
                )}

                <StateLabel state={orbState} />

                {errorMsg && (
                    <div
                        className="absolute bottom-0 left-0 right-0 rounded-2xl px-4 py-2.5 text-[12px] leading-5 text-rose-200/80 text-center"
                        style={{
                            background: "rgba(244,63,94,0.06)",
                            border: "1px solid rgba(244,63,94,0.12)",
                        }}
                    >
                        {errorMsg}
                    </div>
                )}
            </div>

            {/* ── Voice panel ───────────────────────────────────────────── */}
            <div
                className="relative z-10 flex flex-col"
                style={{ minWidth: "13rem" }}
            >
                {/* Section label */}
                <div
                    className="mb-4 text-[10px] font-black uppercase tracking-[0.4em] select-none"
                    style={{ color: "rgba(255,255,255,0.18)" }}
                >
                    Choose Voice
                </div>

                {/* Outer glass card */}
                <div
                    className="flex flex-col gap-1.5 rounded-[1.6rem] p-2"
                    style={{
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        backdropFilter: "blur(18px)",
                    }}
                >
                    {DEFAULT_VOICES.map(voice => {
                        const active = voice.id === selectedVoiceId
                        return (
                            <button
                                key={voice.id}
                                ref={el => {
                                    // Always register every chip on mount — stays stable
                                    if (el) chipRefs.current.set(voice.id, el)
                                    else chipRefs.current.delete(voice.id)
                                }}
                                type="button"
                                onClick={() => setSelectedVoiceId(voice.id)}
                                onMouseEnter={() => setHoveredVoiceId(voice.id)}
                                onMouseLeave={() => setHoveredVoiceId(null)}
                                className="group relative flex items-center gap-4 rounded-[1.2rem] px-5 py-4 text-left transition-all duration-300"
                                style={{
                                    background: active
                                        ? "rgba(255,255,255,0.09)"
                                        : "transparent",
                                    border: active
                                        ? "1px solid rgba(255,255,255,0.12)"
                                        : "1px solid transparent",
                                    boxShadow: active
                                        ? "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)"
                                        : "none",
                                    transform: active ? "scale(1.02)" : "scale(1)",
                                }}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <img
                                        src={voice.image}
                                        alt={voice.name}
                                        className="h-12 w-12 rounded-full object-cover"
                                        style={{
                                            border: active
                                                ? "2px solid rgba(255,255,255,0.28)"
                                                : "1px solid rgba(255,255,255,0.08)",
                                            boxShadow: active
                                                ? "0 0 16px rgba(255,255,255,0.12)"
                                                : "none",
                                            transition: "border 0.3s ease, box-shadow 0.3s ease",
                                        }}
                                    />
                                    {/* Active dot */}
                                    {active && (
                                        <span
                                            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#080808]"
                                            style={{
                                                background: "rgba(134,239,172,1)",
                                                boxShadow: "0 0 6px rgba(134,239,172,0.8)",
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Text */}
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <span
                                        className="text-[15px] font-semibold leading-tight transition-colors duration-300"
                                        style={{
                                            color: active
                                                ? "rgba(255,255,255,0.95)"
                                                : "rgba(255,255,255,0.35)",
                                        }}
                                    >
                                        {voice.name}
                                    </span>
                                </div>

                                {/* Premium attribute popup */}
                                <div
                                    className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 rounded-[1.2rem] px-5 py-3.5 text-[15px] font-semibold tracking-tight text-white/90 shadow-2xl transition-all duration-500 ease-out"
                                    style={{
                                        width: "14rem",
                                        background: "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        backdropFilter: "blur(28px)",
                                        opacity: hoveredVoiceId === voice.id ? 1 : 0,
                                        transform: `translateY(-50%) translateX(${hoveredVoiceId === voice.id ? '0' : '-12px'}) scale(${hoveredVoiceId === voice.id ? 1 : 0.95})`,
                                        visibility: hoveredVoiceId === voice.id ? 'visible' : 'hidden',
                                        boxShadow: "0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
                                        lineHeight: "1.3",
                                    }}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/50" />
                                        <span className="leading-tight">
                                            {voice.description}
                                        </span>
                                    </div>
                                    {/* Glass triangle arrow */}
                                    <div
                                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[7px] border-y-transparent border-r-[7px] border-r-white/10"
                                    />
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}