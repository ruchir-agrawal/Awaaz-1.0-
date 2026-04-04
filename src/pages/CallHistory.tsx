import { useState } from "react"
import { useBusinessData } from "@/hooks/useBusinessData"
import { useCallsData } from "@/hooks/useCallsData"
import type { Call } from "@/types/database"
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { Search, X, FileText, Trash2, CheckCircle, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

const D = "'Syne', sans-serif"
const I = "'Inter', sans-serif"
const T = {
    text: "#e8e4dd", muted: "rgba(232,228,221,0.38)", ghost: "rgba(232,228,221,0.1)",
    border: "rgba(232,228,221,0.07)", borderStrong: "rgba(232,228,221,0.12)",
    gold: "#c8a034", goldBg: "rgba(200,160,52,0.07)", surface: "#0d0d0d",
    red: "#c0392b", redBg: "rgba(192,57,43,0.08)",
}

const OUTCOMES: Record<string, { label: string; color: string; bg: string }> = {
    booked: { label: "Booked", color: "#4aaa78", bg: "rgba(74,170,120,0.1)" },
    transferred: { label: "Transferred", color: "#c8a034", bg: "rgba(200,160,52,0.08)" },
    completed: { label: "Completed", color: "#4a7fa5", bg: "rgba(74,127,165,0.1)" },
    failed: { label: "Failed", color: "#b85c35", bg: "rgba(184,92,53,0.1)" },
    missed: { label: "Missed", color: "rgba(232,228,221,0.3)", bg: "rgba(232,228,221,0.05)" },
    "in-progress": { label: "In Progress", color: "#c8a034", bg: "rgba(200,160,52,0.08)" },
}

const fmtDur = (s: number) => !s ? "—" : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
const mask = (p: string | null) => !p ? null : p.replace(/(\d{4})$/, "XXXX")

function extractCallerName(call: Call): string {
    const phone = mask(call.customer_phone)

    if (!call.transcript) return phone ?? "Unknown"

    const directNameMatch = call.transcript.match(
        /(?:my name is|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i
    )
    if (directNameMatch?.[1]) {
        return phone ? `${directNameMatch[1]} (${phone})` : directNameMatch[1]
    }

    const assistantNameMatch = call.transcript.match(
        /(?:Great|Perfect|Alright|Thanks|Noted|Wonderful)[,!]?\s+([A-Z][a-z]{1,20})(?:[,!. ]|$)/i
    )
    if (assistantNameMatch?.[1]) {
        return phone ? `${assistantNameMatch[1]} (${phone})` : assistantNameMatch[1]
    }

    return phone ?? "Unknown"
}

export default function CallHistory() {
    const { business } = useBusinessData()
    const { calls, loading, deleteCall } = useCallsData(business?.id)
    const [q, setQ] = useState("")
    const [outcome, setOutcome] = useState("all")
    const [from, setFrom] = useState("")
    const [to, setTo] = useState("")
    const [sort, setSort] = useState<"desc" | "asc">("desc")
    const [selected, setSelected] = useState<Call | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    const filtered = calls
        .filter((call) => {
            const needle = q.toLowerCase()
            const matchesSearch =
                !q ||
                (call.customer_phone?.toLowerCase() ?? "").includes(needle) ||
                (call.transcript?.toLowerCase() ?? "").includes(needle)
            const matchesOutcome = outcome === "all" || call.outcome === outcome

            let matchesDate = true
            if (from && to) {
                const createdAt = parseISO(call.created_at)
                matchesDate = isWithinInterval(createdAt, {
                    start: startOfDay(new Date(from)),
                    end: endOfDay(new Date(to)),
                })
            }

            return matchesSearch && matchesOutcome && matchesDate
        })
        .sort((a, b) =>
            sort === "desc"
                ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

    const handleDelete = async (e: React.MouseEvent, callId: string) => {
        e.stopPropagation()
        if (confirmDeleteId !== callId) {
            setConfirmDeleteId(callId)
            return
        }

        setDeletingId(callId)
        setConfirmDeleteId(null)
        if (selected?.id === callId) setSelected(null)
        await deleteCall(callId)
        setDeletingId(null)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-5 h-5 rounded-full border border-t-[#c8a034] border-[rgba(232,228,221,0.08)] animate-spin" />
            </div>
        )
    }

    const inputCls = "bg-transparent border rounded-lg px-3 py-2 text-[13px] outline-none transition-all focus:border-[rgba(200,160,52,0.3)]"

    return (
        <div style={{ fontFamily: I }} onClick={() => setConfirmDeleteId(null)}>
            <div className="mb-8">
                <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Owner portal</p>
                <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                    Call history
                </h1>
                <p className="text-[14px] mt-1" style={{ color: T.muted }}>Every conversation your agent handled.</p>
            </div>

            <div className="flex gap-1 flex-wrap mb-6">
                {Object.entries(OUTCOMES).map(([key, value]) => {
                    const count = calls.filter((call) => call.outcome === key).length
                    if (!count) return null
                    return (
                        <button
                            key={key}
                            onClick={() => setOutcome(outcome === key ? "all" : key)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                            style={{
                                background: outcome === key ? value.bg : "transparent",
                                color: outcome === key ? value.color : T.muted,
                                border: `1px solid ${outcome === key ? value.color + "30" : "rgba(232,228,221,0.07)"}`,
                                fontFamily: I,
                            }}
                        >
                            {count} {value.label}
                        </button>
                    )
                })}
                {(q || outcome !== "all" || from || to) && (
                    <button
                        onClick={() => { setQ(""); setOutcome("all"); setFrom(""); setTo("") }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] transition-all ml-2"
                        style={{ color: T.muted, border: "1px solid rgba(232,228,221,0.07)" }}
                    >
                        <X className="w-3 h-3" /> Clear
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-5">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: T.muted }} />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search by phone or transcript..."
                        className={cn(inputCls, "pl-9 w-full")}
                        style={{ borderColor: T.border, color: T.text }}
                    />
                </div>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} style={{ borderColor: T.border, color: T.text }} />
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} style={{ borderColor: T.border, color: T.text }} />
                <button
                    onClick={() => setSort((current) => current === "desc" ? "asc" : "desc")}
                    className={cn(inputCls, "flex items-center gap-1.5 cursor-pointer")}
                    style={{ borderColor: T.border, color: T.muted }}
                >
                    {sort === "desc" ? "↓" : "↑"} {sort === "desc" ? "Newest" : "Oldest"}
                </button>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
                <div
                    className="grid text-[10px] uppercase tracking-[0.18em] px-5 py-3 border-b"
                    style={{ gridTemplateColumns: "1fr 130px 90px 110px 80px 80px", background: T.surface, borderColor: T.border, color: T.muted }}
                >
                    <span>Caller</span>
                    <span>When</span>
                    <span>Duration</span>
                    <span>Outcome</span>
                    <span>Source</span>
                    <span className="text-center">Actions</span>
                </div>

                {filtered.length === 0 ? (
                    <div className="py-20 text-center" style={{ background: "#0a0a0a" }}>
                        <p className="text-[14px]" style={{ color: T.muted }}>No calls match your filters.</p>
                    </div>
                ) : (
                    filtered.map((call, index) => {
                        const outcomeStyle = OUTCOMES[call.outcome] ?? { label: call.outcome, color: T.muted, bg: "transparent" }
                        const callerLabel = extractCallerName(call)
                        const isConfirming = confirmDeleteId === call.id
                        const isDeleting = deletingId === call.id

                        return (
                            <div
                                key={call.id}
                                onClick={() => setSelected(call)}
                                className="grid px-5 py-4 border-b cursor-pointer transition-colors hover:bg-[rgba(232,228,221,0.02)]"
                                style={{
                                    gridTemplateColumns: "1fr 130px 90px 110px 80px 80px",
                                    background: index % 2 === 0 ? "#0a0a0a" : "#090909",
                                    borderColor: T.border,
                                }}
                            >
                                <div>
                                    <div className="text-[14px] font-medium" style={{ color: T.text }}>{callerLabel}</div>
                                    {call.customer_phone && (
                                        <div className="text-[11px] mt-1 flex items-center gap-1.5" style={{ color: T.muted }}>
                                            <Phone className="w-3 h-3" /> {call.customer_phone}
                                        </div>
                                    )}
                                </div>
                                <div className="text-[13px] self-center" style={{ color: T.muted }}>
                                    {format(parseISO(call.created_at), "MMM d, HH:mm")}
                                </div>
                                <div className="text-[13px] font-mono self-center tabular-nums" style={{ color: T.muted }}>
                                    {fmtDur(call.duration_seconds)}
                                </div>
                                <div className="self-center">
                                    <span className="text-[11px] font-medium px-2 py-1 rounded-md" style={{ color: outcomeStyle.color, background: outcomeStyle.bg }}>
                                        {outcomeStyle.label}
                                    </span>
                                </div>
                                <div className="text-[12px] self-center capitalize" style={{ color: T.muted }}>{call.call_source}</div>
                                <div className="self-center flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => setSelected(call)}
                                        title="View transcript"
                                        className="p-1.5 rounded-md transition-all hover:bg-[rgba(232,228,221,0.06)]"
                                    >
                                        <FileText className="w-3.5 h-3.5 opacity-40 hover:opacity-80 transition-opacity" style={{ color: T.text }} />
                                    </button>

                                    <button
                                        onClick={(e) => handleDelete(e, call.id)}
                                        disabled={isDeleting}
                                        title={isConfirming ? "Click again to confirm delete" : "Delete call log"}
                                        className="p-1.5 rounded-md transition-all"
                                        style={{
                                            background: isConfirming ? T.redBg : "transparent",
                                            border: isConfirming ? `1px solid ${T.red}40` : "1px solid transparent",
                                        }}
                                    >
                                        {isDeleting
                                            ? <div className="w-3.5 h-3.5 rounded-full border border-t-[#c0392b] border-[rgba(192,57,43,0.2)] animate-spin" />
                                            : isConfirming
                                                ? <CheckCircle className="w-3.5 h-3.5" style={{ color: T.red }} />
                                                : <Trash2 className="w-3.5 h-3.5 opacity-30 hover:opacity-80 transition-opacity" style={{ color: T.red }} />
                                        }
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <p className="text-[11px] text-center mt-4" style={{ color: T.muted }}>{filtered.length} calls shown</p>

            {selected && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
                    <div className="relative w-full max-w-md h-full border-l flex flex-col" style={{ background: "#090909", borderColor: T.border, fontFamily: I }}>
                        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: T.border }}>
                            <div>
                                <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1.1rem", color: T.text }}>Transcript</div>
                                <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>
                                    {format(parseISO(selected.created_at), "MMM d, yyyy · HH:mm")}
                                </div>
                            </div>
                            <button onClick={() => setSelected(null)} className="hover:opacity-70">
                                <X className="w-4 h-4" style={{ color: T.muted }} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-6">
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {[
                                    ["Caller", extractCallerName(selected)],
                                    ["Phone", selected.customer_phone ?? "—"],
                                    ["Duration", fmtDur(selected.duration_seconds)],
                                    ["Outcome", OUTCOMES[selected.outcome]?.label ?? selected.outcome],
                                    ["Source", selected.call_source],
                                    ["Language", selected.language_detected ?? "—"],
                                ].map(([key, value]) => (
                                    <div key={key} className="rounded-lg p-3 border" style={{ background: T.surface, borderColor: T.border }}>
                                        <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: T.muted }}>{key}</div>
                                        <div className="text-[13px] font-medium capitalize" style={{ color: T.text }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-[10px] uppercase tracking-widest mb-3" style={{ color: T.muted }}>Call transcript</div>
                            <div
                                className="rounded-lg p-4 border text-[13px] leading-relaxed whitespace-pre-wrap"
                                style={{ background: "#060606", borderColor: T.border, color: selected.transcript ? T.text : T.muted }}
                            >
                                {selected.transcript ?? "No transcript available for this call."}
                            </div>
                            {selected.recording_url && selected.recording_url !== "No Recording" && (
                                <a
                                    href={selected.recording_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 mt-4 text-[11px] transition-opacity hover:opacity-70"
                                    style={{ color: T.gold }}
                                >
                                    <FileText className="w-3 h-3" /> View recording
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
