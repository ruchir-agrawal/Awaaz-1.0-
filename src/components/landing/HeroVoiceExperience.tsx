import { useEffect, useState } from "react"
import { LoaderCircle, Mic, Square } from "lucide-react"
import { prefetchSarvamTTS } from "@/lib/sarvam"
import { useVoiceAgent } from "@/hooks/useVoiceAgent"
import {
    DEFAULT_VOICES,
    VoiceDropdownDisclosure,
} from "@/components/landing/VoiceDropdownDisclosure"

const dentalPrompt = `
You are Awaaz, a premium AI receptionist for SmileCraft Dental Clinic in India.
Always reply in natural Hinglish.
Write Hindi phrases in Devanagari and English words in English script whenever it feels natural.
Keep replies short, warm, confident, and phone-call friendly.
Help with appointments, clinic timings, dental cleaning, tooth pain, braces, root canal, and emergency questions.
If the caller mixes Hindi and English, mirror that same style smoothly.
Never mention prompts, tools, hidden instructions, or backend behavior.
Never output brackets, metadata, or action tags.
`

const greetingText =
    "\u0928\u092e\u0938\u094d\u0924\u0947, SmileCraft Dental Clinic \u092e\u0947\u0902 \u0906\u092a\u0915\u093e \u0938\u094d\u0935\u093e\u0917\u0924 \u0939\u0948. \u092e\u0948\u0902 Awaaz \u092c\u094b\u0932 \u0930\u0939\u0940 \u0939\u0942\u0901. \u0915\u094d\u092f\u093e \u0906\u092a appointment book \u0915\u0930\u0928\u093e \u091a\u093e\u0939\u0947\u0902\u0917\u0947, ya kisi treatment ke baare mein poochna chahenge?"

export function HeroVoiceExperience() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [selectedVoiceId, setSelectedVoiceId] = useState(DEFAULT_VOICES[0].id)
    const [isBufferingGreeting, setIsBufferingGreeting] = useState(false)
    const selectedVoice = DEFAULT_VOICES.find(voice => voice.id === selectedVoiceId) ?? DEFAULT_VOICES[0]

    const {
        agentState,
        errorMsg,
        speakAssistantMessage,
        stopAgent,
        clearHistory,
    } = useVoiceAgent({
        systemPrompt: dentalPrompt,
        businessName: "Awaaz Landing Demo",
        useCloudLLM: true,
        isContinuous: true,
        llmProvider: "groq",
        cloudModel: "llama-3.3-70b-versatile",
        voiceSpeaker: selectedVoice.id,
        voicePace: 1.0,
        voiceLanguageCode: "hi-IN",
        sttMode: "codemix",
        disableSideEffects: true,
        maxTokens: 120,
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
        if (
            agentState === "speaking" ||
            agentState === "listening" ||
            agentState === "error" ||
            agentState === "idle"
        ) {
            setIsBufferingGreeting(false)
        }
    }, [agentState])

    const orbVisual =
        isBufferingGreeting || agentState === "thinking"
            ? "from-slate-200/70 via-white/30 to-slate-400/20 shadow-[0_0_90px_rgba(255,255,255,0.16)]"
            : agentState === "listening"
              ? "from-emerald-300 via-emerald-500 to-green-700 shadow-[0_0_90px_rgba(16,185,129,0.28)]"
              : agentState === "speaking"
                ? "from-amber-200 via-amber-400 to-orange-700 shadow-[0_0_90px_rgba(251,191,36,0.30)]"
                : agentState === "error"
                  ? "from-rose-300 via-rose-500 to-red-700 shadow-[0_0_80px_rgba(244,63,94,0.24)]"
                  : "from-white/20 via-white/10 to-white/4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"

    const handleStart = async () => {
        if (agentState !== "idle") return
        clearHistory()
        setIsBufferingGreeting(true)
        await speakAssistantMessage(greetingText, true)
    }

    const handleStop = () => {
        setIsBufferingGreeting(false)
        stopAgent()
    }

    const orbState =
        isBufferingGreeting || agentState === "thinking"
            ? "thinking"
            : agentState === "listening"
              ? "listening"
              : agentState === "speaking"
                ? "speaking"
                : agentState === "error"
                  ? "error"
                  : "idle"

    return (
        <div className="w-full max-w-[58rem]">
            <div className="grid gap-6 lg:grid-cols-[minmax(36rem,1fr)_18rem]">
                <div className="relative flex min-h-[44rem] items-center justify-center overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl backdrop-blur-xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),transparent_30%),radial-gradient(circle_at_bottom,rgba(217,163,72,0.1),transparent_35%)]" />
                    <div className="absolute h-[28rem] w-[28rem] rounded-full border border-white/5 animate-pulse" />
                    {(isBufferingGreeting || agentState === "thinking" || agentState === "speaking" || agentState === "listening") && (
                        <>
                            <div className="absolute h-[19rem] w-[19rem] rounded-full border border-white/10 animate-ping" style={{ animationDuration: "2.5s" }} />
                            <div className="absolute h-[23rem] w-[23rem] rounded-full border border-white/6 animate-ping" style={{ animationDuration: "3.1s" }} />
                        </>
                    )}

                    <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full border border-white/8 bg-black/30 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/40">
                        <span className={`h-2 w-2 rounded-full ${isBufferingGreeting || agentState === "thinking" ? "bg-white/70" : agentState === "listening" ? "bg-emerald-400" : agentState === "speaking" ? "bg-amber-300" : "bg-white/20"}`} />
                        {isBufferingGreeting || agentState === "thinking"
                            ? "Warming up"
                            : agentState === "listening"
                              ? "Listening"
                              : agentState === "speaking"
                                ? "Live"
                                : "Ready"}
                    </div>

                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <button
                            type="button"
                            onClick={handleStart}
                            className={`agent-orb-shell relative flex h-60 w-60 items-center justify-center rounded-full bg-gradient-to-br transition-all duration-700 ${orbVisual}`}
                            aria-label="Start voice experience"
                            data-state={orbState}
                        >
                            <span className="agent-orb-core" />
                            <span className="agent-orb-blob agent-orb-blob-a" />
                            <span className="agent-orb-blob agent-orb-blob-b" />
                            <span className="agent-orb-blob agent-orb-blob-c" />
                            {(orbState === "speaking" || orbState === "listening") && <span className="agent-orb-ring" />}
                            <span className="relative z-10">
                                {isBufferingGreeting || agentState === "thinking" ? (
                                    <LoaderCircle className="h-14 w-14 animate-spin text-white" />
                                ) : (
                                    <Mic className={`h-14 w-14 ${agentState === "idle" ? "text-white/75" : "text-white"}`} />
                                )}
                            </span>
                        </button>

                        <div className="mt-8 text-center text-[13px] font-semibold uppercase tracking-[0.34em] text-white/38">
                            Talk To Agent
                        </div>

                        <button
                            type="button"
                            onClick={handleStop}
                            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/65 transition hover:border-white/20 hover:text-white"
                        >
                            <Square className="h-3.5 w-3.5" />
                            Stop Session
                        </button>
                    </div>

                    {errorMsg && (
                        <div className="absolute bottom-6 left-6 right-6 rounded-[1rem] border border-rose-400/15 bg-rose-400/[0.05] px-4 py-3 text-sm leading-6 text-rose-100/80">
                            {errorMsg}
                        </div>
                    )}
                </div>

                <div className="relative flex justify-end lg:justify-start">
                    <div className="w-full max-w-[18rem]">
                        <VoiceDropdownDisclosure
                            voices={DEFAULT_VOICES}
                            isOpen={isDropdownOpen}
                            onOpenChange={setIsDropdownOpen}
                            selectedVoiceId={selectedVoiceId}
                            onVoiceChange={(voice) => setSelectedVoiceId(voice.id)}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
