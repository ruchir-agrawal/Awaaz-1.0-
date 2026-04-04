import { useEffect, useRef } from "react"
import { useVoiceAgent } from "@/hooks/useVoiceAgent"
import { useBusinessData } from "@/hooks/useBusinessData"
import { useState } from "react"
import { Mic, Trash2, Activity, AlertCircle, MessageSquare, BrainCircuit, Sparkles } from "lucide-react"

const D = "'Syne', sans-serif"
const I = "'Inter', sans-serif"
const T = {
    text: "#e8e4dd",
    muted: "rgba(232,228,221,0.38)",
    ghost: "rgba(232,228,221,0.1)",
    border: "rgba(232,228,221,0.07)",
    borderStrong: "rgba(232,228,221,0.12)",
    gold: "#c8a034",
    goldBg: "rgba(200,160,52,0.08)",
    terra: "#b85c35",
    surface: "#0d0d0d",
    ok: "#4aaa78",
    bg: "#080808",
}

export default function Playground() {
    const { business, loading: businessLoading } = useBusinessData()
    const [systemPrompt, setSystemPrompt] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)

    /* Build prompt from business record + Google Sheet appointments */
    useEffect(() => {
        if (!business?.system_prompt) return
        const init = async () => {
            const sessionUid = (business.slug?.toUpperCase() || "AWZ") + "-" + Math.random().toString(36).substring(2, 6).toUpperCase()
            const nowIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true, hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

            let base = business.system_prompt!
            
            // Inject Variables
            base = base.replace(/{{SESSION_UID}}/g, sessionUid)
            base = base.replace(/{{current_time_IST}}/g, nowIST)
            base = base.replace(/{{user_number}}/g, "Unknown")

            // Append Technical Guide for Actions
            base += `\n\n[TECHNICAL INSTRUCTIONS]:
To trigger the functions mentioned in your prompt, you MUST use this exact syntax:
- For Availability: [[ACTION: check_calendar_availability | reason: <reason>]]
- For Booking: [[ACTION: book_appointment | patient_name: <name> | phone_number: <phone> | appointment_datetime: <YYYY-MM-DD HH:mm in IST> | service_reason: <service> | new_or_returning: <status>]]
- For Logging (End of call): [[ACTION: log_call_data | session_uid: ${sessionUid} | patient_name: <name> | phone_number: <phone> | new_or_returning: <status> | service_reason: <reason> | appointment_datetime: <datetime>]]
- For Transfer: [[ACTION: transfer_call | reason: <reason>]]

IMPORTANT: Always trigger log_call_data BEFORE saying your final goodbye.`

            const bridgeUrl = import.meta.env.VITE_GOOGLE_BRIDGE_URL
            if (bridgeUrl && business.name) {
                try {
                    const res = await fetch(`${bridgeUrl}?businessName=${encodeURIComponent(business.name)}`)
                    const json = await res.json()
                    if (json.status === "ok" && json.appointments?.length > 0) {
                        const lines = json.appointments.map((a: any) =>
                            `- ${a.callTime}: ${a.patientName} (${a.mobile}) — ${a.reason} — Status: ${a.status}`
                        ).join("\n")
                        base += `\n\n[EXISTING APPOINTMENTS — DO NOT DOUBLE BOOK]:\n${lines}\n\nCheck this list before booking. If a slot is taken, tell the caller and suggest the next available time.`
                    }
                } catch { /* silent */ }
            }
            setSystemPrompt(base)
        }
        init()
    }, [business])

    const { agentState, messages, errorMsg, startListening, stopAgent, clearHistory } = useVoiceAgent({
        systemPrompt,
        businessName: business?.name,
        useCloudLLM: true,
        isContinuous: true,
    })

    const displayMessages = messages.filter(m => m.role !== "system")

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [messages, agentState])

    const agentName = business?.agent_name || "Agent"

    /* State-driven orb styles */
    const orbStyle = (() => {
        if (agentState === "listening") return {
            background: "radial-gradient(circle at 35% 35%, #22c55e, #16a34a)",
            boxShadow: "0 0 80px rgba(34,197,94,0.35), 0 0 160px rgba(34,197,94,0.15)"
        }
        if (agentState === "thinking") return {
            background: "radial-gradient(circle at 35% 35%, #3b82f6, #1d4ed8)",
            boxShadow: "0 0 80px rgba(59,130,246,0.35), 0 0 160px rgba(59,130,246,0.15)"
        }
        if (agentState === "speaking") return {
            background: `radial-gradient(circle at 35% 35%, #c8a034, #9d7a20)`,
            boxShadow: `0 0 80px rgba(200,160,52,0.35), 0 0 160px rgba(200,160,52,0.12)`
        }
        if (agentState === "error") return {
            background: "radial-gradient(circle at 35% 35%, #ef4444, #b91c1c)",
            boxShadow: "0 0 60px rgba(239,68,68,0.3)"
        }
        return {
            background: "radial-gradient(circle at 35% 35%, rgba(232,228,221,0.12), rgba(232,228,221,0.05))",
            boxShadow: "0 0 0 1px rgba(232,228,221,0.08), inset 0 1px 0 rgba(232,228,221,0.06)"
        }
    })()

    const stateLabel = {
        idle: "Ready",
        listening: "Listening…",
        thinking: "Thinking…",
        speaking: "Speaking…",
        error: "Error",
    }[agentState] ?? agentState

    return (
        <div style={{ fontFamily: I, color: T.text }}>
            {/* No prompt warning */}
            {!businessLoading && !business?.system_prompt && (
                <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl border mb-6"
                    style={{ background: "rgba(200,160,52,0.06)", borderColor: "rgba(200,160,52,0.2)" }}>
                    <Sparkles className="w-4 h-4 shrink-0" style={{ color: T.gold }} />
                    <p className="text-[13px]" style={{ color: T.muted }}>
                        <span className="font-semibold" style={{ color: T.gold }}>No system prompt configured.</span>
                        {" "}Go to Settings → Agent Config to add a prompt.
                    </p>
                </div>
            )}

            {/* Page header */}
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Admin console</p>
                    <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                        Agent Playground
                    </h1>
                    <p className="text-[14px] mt-1" style={{ color: T.muted }}>
                        Live test of {agentName} — powered by Sarvam AI + Llama 3.3.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full"
                        style={{ background: agentState !== "idle" ? T.ok : "rgba(232,228,221,0.2)", boxShadow: agentState !== "idle" ? `0 0 8px ${T.ok}` : "none" }} />
                    <span className="text-[12px] font-medium" style={{ color: agentState !== "idle" ? T.ok : T.muted }}>
                        {stateLabel}
                    </span>
                </div>
            </div>

            {/* Main layout */}
            <div className="grid lg:grid-cols-[420px_1fr] gap-5 h-[calc(100vh-18rem)] min-h-[440px]">

                {/* LEFT — Orb panel */}
                <div className="flex flex-col items-center justify-between rounded-xl border overflow-hidden py-10 px-8"
                    style={{ background: T.surface, borderColor: T.border }}>

                    {/* Agent info */}
                    <div className="text-center">
                        <div className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: T.muted }}>Active agent</div>
                        <div style={{ fontFamily: D, fontWeight: 700, fontSize: "1.2rem", color: T.text, letterSpacing: "-0.02em" }}>
                            {agentName}
                        </div>
                        <div className="text-[12px] mt-1" style={{ color: T.muted }}>
                            {business?.name ?? "—"}
                        </div>
                    </div>

                    {/* Orb */}
                    <div className="relative flex items-center justify-center">
                        {/* Ripple rings when active */}
                        {agentState !== "idle" && agentState !== "error" && (
                            <>
                                <div className="absolute rounded-full animate-ping"
                                    style={{ width: 220, height: 220, border: "1px solid rgba(232,228,221,0.06)", animationDuration: "2s" }} />
                                <div className="absolute rounded-full animate-ping"
                                    style={{ width: 260, height: 260, border: "1px solid rgba(232,228,221,0.04)", animationDuration: "2.5s", animationDelay: "0.4s" }} />
                            </>
                        )}

                        <button
                            onClick={agentState === "idle" ? startListening : stopAgent}
                            className="relative z-10 rounded-full flex items-center justify-center transition-all duration-700"
                            style={{ width: 180, height: 180, ...orbStyle }}>
                            {agentState === "idle" && <Mic className="w-12 h-12" style={{ color: T.muted }} />}
                            {agentState === "listening" && <Mic className="w-12 h-12 text-white" />}
                            {agentState === "thinking" && <BrainCircuit className="w-12 h-12 text-white animate-pulse" />}
                            {agentState === "speaking" && <Activity className="w-12 h-12 text-white" />}
                            {agentState === "error" && <AlertCircle className="w-12 h-12 text-white" />}
                        </button>
                    </div>

                    {/* CTA */}
                    <div className="text-center space-y-4 w-full">
                        {agentState === "idle" ? (
                            <>
                                <button onClick={startListening}
                                    className="w-full py-3 rounded-xl text-[14px] font-semibold transition-all hover:opacity-85 active:scale-[0.98]"
                                    style={{ background: T.goldBg, color: T.gold, border: `1px solid rgba(200,160,52,0.2)`, fontFamily: I }}>
                                    Start Call
                                </button>
                                <p className="text-[11px]" style={{ color: T.muted }}>Microphone required</p>
                            </>
                        ) : (
                            <button onClick={stopAgent}
                                className="w-full py-3 rounded-xl text-[14px] font-semibold transition-all hover:opacity-85 active:scale-[0.98]"
                                style={{ background: "rgba(184,92,53,0.12)", color: T.terra, border: "1px solid rgba(184,92,53,0.25)", fontFamily: I }}>
                                End Session
                            </button>
                        )}

                        {/* Stack info */}
                        <div className="flex items-center justify-center gap-3 text-[11px]" style={{ color: "rgba(232,228,221,0.25)" }}>
                            <span>Sarvam AI</span>
                            <span>·</span>
                            <span>Llama 3</span>
                            <span>·</span>
                            <span>Groq LPU</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT — Transcript */}
                <div className="flex flex-col rounded-xl border overflow-hidden" style={{ background: T.surface, borderColor: T.border }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: T.border }}>
                        <div className="flex items-center gap-2.5">
                            <MessageSquare className="w-4 h-4" style={{ color: T.muted }} />
                            <span style={{ fontFamily: D, fontWeight: 600, fontSize: "0.95rem", color: T.text }}>Transcript</span>
                            <span className="text-[12px]" style={{ color: T.muted }}>
                                {displayMessages.length > 0 ? `${displayMessages.length} messages` : ""}
                            </span>
                        </div>
                        {displayMessages.length > 0 && (
                            <button onClick={clearHistory}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all hover:bg-[rgba(184,92,53,0.08)]"
                                style={{ color: T.muted, fontFamily: I }}>
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                        {displayMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                                <div className="w-10 h-10 rounded-xl border flex items-center justify-center" style={{ borderColor: T.border }}>
                                    <MessageSquare className="w-5 h-5" style={{ color: "rgba(232,228,221,0.18)" }} />
                                </div>
                                <div>
                                    <p className="text-[13px] font-medium" style={{ color: T.muted }}>No transcript yet</p>
                                    <p className="text-[12px] mt-0.5" style={{ color: "rgba(232,228,221,0.22)" }}>Start the call to see live conversation</p>
                                </div>
                            </div>
                        ) : (
                            displayMessages.map((msg, idx) => {
                                const isUser = msg.role === "user"
                                return (
                                    <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                                        <div className="max-w-[80%] space-y-1">
                                            <div className="text-[10px] uppercase tracking-[0.15em] px-1"
                                                style={{ color: isUser ? T.gold : T.muted, textAlign: isUser ? "right" : "left" }}>
                                                {isUser ? "Caller" : agentName}
                                            </div>
                                            <div className="px-4 py-3 rounded-xl text-[14px] leading-relaxed"
                                                style={{
                                                    background: isUser ? T.goldBg : "rgba(232,228,221,0.04)",
                                                    border: `1px solid ${isUser ? "rgba(200,160,52,0.15)" : T.border}`,
                                                    color: T.text,
                                                    borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px"
                                                }}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}

                        {/* Thinking indicator */}
                        {agentState === "thinking" && (
                            <div className="flex justify-start">
                                <div className="px-4 py-3 rounded-xl border flex items-center gap-1.5"
                                    style={{ background: "rgba(232,228,221,0.04)", borderColor: T.border, borderRadius: "4px 16px 16px 16px" }}>
                                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: T.muted, animationDelay: "0ms" }} />
                                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: T.muted, animationDelay: "150ms" }} />
                                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: T.muted, animationDelay: "300ms" }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error toast */}
            {errorMsg && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border"
                    style={{ background: "rgba(184,92,53,0.12)", borderColor: "rgba(184,92,53,0.3)", color: T.terra, fontFamily: I, backdropFilter: "blur(12px)" }}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-[13px]">{errorMsg}</span>
                    <button onClick={() => window.location.reload()}
                        className="ml-2 text-[11px] px-2.5 py-1 rounded-md transition-all"
                        style={{ background: "rgba(184,92,53,0.12)", border: "1px solid rgba(184,92,53,0.2)" }}>
                        Retry
                    </button>
                </div>
            )}
        </div>
    )
}
