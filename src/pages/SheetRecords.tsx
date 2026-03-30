import { useState, useEffect, useCallback } from "react"
import { useBusinessData } from "@/hooks/useBusinessData"
import { RefreshCw, ExternalLink, ChevronDown, ChevronUp, Clock } from "lucide-react"

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
    surface: "#0d0d0d",
    green: "#4aaa78",
    greenBg: "rgba(74,170,120,0.1)",
    red: "#c0392b",
}

// Column indices match google_bridge_v2.js 10-column layout
// A=0: CALL DATE & TIME | B=1: PATIENT NAME | C=2: MOBILE |
// D=3: NEW/RETURNING     | E=4: SERVICE      | F=5: APPT DATE |
// G=6: STATUS            | H=7: SESSION UID  | I=8: TRANSCRIPT | J=9: RECORDING
interface SheetRow {
    callTime: string
    patientName: string
    mobile: string
    newOrReturning: string
    serviceReason: string
    appointmentDatetime: string
    status: string
    sessionUid: string
    transcript: string
    recordingLink: string
}

const AUTO_REFRESH_INTERVAL = 30_000 // 30 seconds

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase() ?? ""
    let color = T.muted
    let bg = "transparent"
    if (s.includes("confirm")) { color = T.green; bg = T.greenBg }
    else if (s.includes("inquiry")) { color = T.gold; bg = T.goldBg }
    else if (s.includes("abrupt") || s.includes("error")) { color = T.red; bg = "rgba(192,57,43,0.1)" }
    return (
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md whitespace-nowrap"
            style={{ color, background: bg, border: `1px solid ${color}30` }}>
            {status || "—"}
        </span>
    )
}

function TranscriptRow({ row }: { row: SheetRow }) {
    const [open, setOpen] = useState(false)
    const hasTranscript = !!(row.transcript && row.transcript !== "No transcript available")

    return (
        <>
            <div className="grid px-5 py-3.5 border-b transition-colors hover:bg-[rgba(232,228,221,0.018)]"
                style={{
                    gridTemplateColumns: "160px 1fr 120px 130px 110px 100px 32px",
                    borderColor: T.border,
                }}>
                {/* Call time */}
                <div className="text-[12px] font-mono self-center pr-4 truncate" style={{ color: T.muted }}>
                    {row.callTime || "—"}
                </div>

                {/* Patient */}
                <div className="self-center min-w-0 pr-3">
                    <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>
                        {row.patientName && row.patientName !== "Not Captured" ? row.patientName : <span style={{ color: T.muted }}>Unknown</span>}
                    </div>
                    {row.mobile && row.mobile !== "Not Provided" && (
                        <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>
                            {row.mobile.replace(/^'/, "")}
                        </div>
                    )}
                </div>

                {/* Service */}
                <div className="text-[12px] self-center truncate pr-3 capitalize" style={{ color: T.muted }}>
                    {row.serviceReason && row.serviceReason !== "N/A" ? row.serviceReason : "—"}
                </div>

                {/* Appointment */}
                <div className="text-[12px] self-center truncate pr-3" style={{ color: row.appointmentDatetime && row.appointmentDatetime !== "-" ? T.gold : T.muted }}>
                    {row.appointmentDatetime && row.appointmentDatetime !== "-" ? row.appointmentDatetime : "—"}
                </div>

                {/* Status */}
                <div className="self-center">
                    <StatusBadge status={row.status} />
                </div>

                {/* New/Returning */}
                <div className="text-[11px] self-center capitalize" style={{ color: T.muted }}>
                    {row.newOrReturning && row.newOrReturning !== "Not Specified" ? row.newOrReturning : "—"}
                </div>

                {/* Expand */}
                {hasTranscript ? (
                    <button onClick={() => setOpen(o => !o)}
                        className="self-center flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-[rgba(232,228,221,0.08)]">
                        {open
                            ? <ChevronUp className="w-3.5 h-3.5" style={{ color: T.muted }} />
                            : <ChevronDown className="w-3.5 h-3.5" style={{ color: T.muted }} />}
                    </button>
                ) : <div />}
            </div>

            {/* Expanded transcript */}
            {open && hasTranscript && (
                <div className="px-5 py-4 border-b" style={{ background: "#060606", borderColor: T.border }}>
                    <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: T.muted }}>Transcript</div>
                    <pre className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: T.text, fontFamily: I }}>
                        {row.transcript}
                    </pre>
                    {row.recordingLink && row.recordingLink !== "No Recording" && !row.recordingLink.startsWith("Recording Error") && (
                        <a href={row.recordingLink} target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 mt-3 text-[11px] transition-opacity hover:opacity-70"
                            style={{ color: T.gold }}>
                            <ExternalLink className="w-3 h-3" /> View Recording
                        </a>
                    )}
                </div>
            )}
        </>
    )
}

export default function SheetRecords() {
    const { business } = useBusinessData()
    const [rows, setRows] = useState<SheetRow[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL / 1000)

    const bridgeUrl = import.meta.env.VITE_GOOGLE_BRIDGE_URL

    const fetchData = useCallback(async (silent = false) => {
        if (!business?.name || !bridgeUrl) {
            setLoading(false)
            setError("Google Bridge URL not configured.")
            return
        }
        if (!silent) setLoading(true)
        else setRefreshing(true)
        setError(null)

        try {
            const res = await fetch(`${bridgeUrl}?businessName=${encodeURIComponent(business.name)}`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const json = await res.json()

            if (json.status !== "ok") throw new Error(json.message || "Unknown error from bridge")

            // Map raw appointment objects from GET endpoint to full row shape
            // The GET endpoint currently only returns the first 6 cols (A-F).
            // We map what we have and leave the rest as empty strings.
            const mapped: SheetRow[] = (json.appointments ?? []).map((a: any) => ({
                callTime: a.callTime ?? "",
                patientName: a.patientName ?? "",
                mobile: a.mobile ?? "",
                newOrReturning: a.newOrReturning ?? a.patientId ?? "",
                serviceReason: a.reason ?? "",
                appointmentDatetime: a.appointmentDatetime ?? "",
                status: a.status ?? "",
                sessionUid: a.sessionUid ?? a.patientId ?? "",
                transcript: a.transcript ?? "",
                recordingLink: a.recordingLink ?? "",
            }))
            // Newest first
            setRows(mapped.reverse())
            setLastRefreshed(new Date())
        } catch (e: any) {
            setError(e.message || "Failed to fetch sheet data.")
        } finally {
            setLoading(false)
            setRefreshing(false)
            setCountdown(AUTO_REFRESH_INTERVAL / 1000)
        }
    }, [business?.name, bridgeUrl])

    // Initial load
    useEffect(() => { fetchData() }, [fetchData])

    // Auto-refresh every 30s
    useEffect(() => {
        const interval = setInterval(() => fetchData(true), AUTO_REFRESH_INTERVAL)
        return () => clearInterval(interval)
    }, [fetchData])

    // Countdown ticker
    useEffect(() => {
        const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
        return () => clearInterval(tick)
    }, [lastRefreshed])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-5 h-5 rounded-full border border-t-[#c8a034] border-[rgba(232,228,221,0.08)] animate-spin" />
        </div>
    )

    return (
        <div style={{ fontFamily: I }}>
            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Owner portal</p>
                    <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                        Sheet Records
                    </h1>
                    <p className="text-[14px] mt-1" style={{ color: T.muted }}>
                        Live view of your Google Sheet — all call logs synced here.
                    </p>
                </div>

                <div className="flex items-center gap-3 mt-2 shrink-0">
                    {lastRefreshed && (
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: T.muted }}>
                            <Clock className="w-3 h-3" />
                            Refreshes in {countdown}s
                        </div>
                    )}
                    <button onClick={() => fetchData(true)} disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all hover:opacity-80 disabled:opacity-40"
                        style={{ background: T.goldBg, color: T.gold, border: "1px solid rgba(200,160,52,0.2)", fontFamily: I }}>
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        {refreshing ? "Refreshing…" : "Refresh"}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 px-5 py-4 rounded-xl border text-[13px]"
                    style={{ background: "rgba(192,57,43,0.08)", borderColor: "rgba(192,57,43,0.2)", color: "#e07060" }}>
                    ⚠ {error}
                    {!bridgeUrl && (
                        <div className="mt-1 text-[12px]" style={{ color: T.muted }}>
                            Set <code>VITE_GOOGLE_BRIDGE_URL</code> in your <code>.env.local</code> file.
                        </div>
                    )}
                </div>
            )}

            {/* Stats row */}
            {rows.length > 0 && (
                <div className="flex gap-4 mb-6 flex-wrap">
                    {[
                        { label: "Total Records", value: rows.length },
                        { label: "Confirmed Appts", value: rows.filter(r => r.status?.toLowerCase().includes("confirm")).length },
                        { label: "Inquiries", value: rows.filter(r => r.status?.toLowerCase().includes("inquiry")).length },
                        { label: "Returning Patients", value: rows.filter(r => r.newOrReturning?.toLowerCase().includes("return")).length },
                    ].map(s => (
                        <div key={s.label} className="px-4 py-3 rounded-xl border flex-1 min-w-[110px]"
                            style={{ background: T.surface, borderColor: T.border }}>
                            <div style={{ fontFamily: D, fontWeight: 700, fontSize: "1.5rem", color: T.text, letterSpacing: "-0.03em" }}>
                                {s.value}
                            </div>
                            <div className="text-[10px] uppercase tracking-[0.15em] mt-1" style={{ color: T.muted }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
                {/* Table header */}
                <div className="grid px-5 py-3 border-b text-[10px] uppercase tracking-[0.18em]"
                    style={{
                        gridTemplateColumns: "160px 1fr 120px 130px 110px 100px 32px",
                        background: T.surface,
                        borderColor: T.border,
                        color: T.muted,
                    }}>
                    <span>Date & Time</span>
                    <span>Patient</span>
                    <span>Service</span>
                    <span>Appointment</span>
                    <span>Status</span>
                    <span>Type</span>
                    <span />
                </div>

                {rows.length === 0 ? (
                    <div className="py-20 text-center" style={{ background: "#0a0a0a" }}>
                        <p className="text-[14px]" style={{ color: T.muted }}>
                            {error ? "Could not load data." : "No records found in the sheet yet."}
                        </p>
                        <p className="text-[12px] mt-1" style={{ color: T.muted }}>
                            Records appear here after calls are completed.
                        </p>
                    </div>
                ) : (
                    rows.map((row, i) => (
                        <TranscriptRow key={`${row.sessionUid}-${i}`} row={row} />
                    ))
                )}
            </div>

            <p className="text-[11px] text-center mt-4" style={{ color: T.muted }}>
                {rows.length} record{rows.length !== 1 ? "s" : ""} · Last synced {lastRefreshed ? lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
            </p>
        </div>
    )
}
