import { useState, useEffect, useCallback } from "react"
import { useBusinessData } from "@/hooks/useBusinessData"
import { supabase } from "@/lib/supabase"
import { RefreshCw, ExternalLink, ChevronDown, ChevronUp, Clock, Download } from "lucide-react"

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

interface BridgeAppointmentRow {
    callTime?: string
    patientName?: string
    mobile?: string
    newOrReturning?: string
    reason?: string
    appointmentDatetime?: string
    status?: string
    sessionUid?: string
    transcript?: string
    recordingLink?: string
}

interface BridgeResponse {
    status: string
    message?: string
    appointments?: BridgeAppointmentRow[]
}

interface CallRecordFallback {
    created_at: string
    customer_phone: string | null
    outcome: string
    transcript: string | null
    recording_url: string | null
}

const AUTO_REFRESH_INTERVAL = 10_000

function extractPatientNameFromTranscript(transcript: string | null) {
    if (!transcript) return ""
    const match = transcript.match(/(?:my name is|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i)
    return match?.[1] ?? ""
}

function extractReasonFromTranscript(transcript: string | null) {
    if (!transcript) return "â€”"
    const match = transcript.match(/(?:for|about|regarding)\s+([^.!\n]+)/i)
    return match?.[1]?.trim() ?? "â€”"
}

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
            {status || "â€”"}
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
                <div className="text-[12px] font-mono self-center pr-4 truncate" style={{ color: T.muted }}>
                    {row.callTime || "â€”"}
                </div>

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

                <div className="text-[12px] self-center truncate pr-3 capitalize" style={{ color: T.muted }}>
                    {row.serviceReason && row.serviceReason !== "N/A" ? row.serviceReason : "â€”"}
                </div>

                <div className="text-[12px] self-center truncate pr-3" style={{ color: row.appointmentDatetime && row.appointmentDatetime !== "-" ? T.gold : T.muted }}>
                    {row.appointmentDatetime && row.appointmentDatetime !== "-" ? row.appointmentDatetime : "â€”"}
                </div>

                <div className="self-center">
                    <StatusBadge status={row.status} />
                </div>

                <div className="text-[11px] self-center capitalize" style={{ color: T.muted }}>
                    {row.newOrReturning && row.newOrReturning !== "Not Specified" ? row.newOrReturning : "â€”"}
                </div>

                {hasTranscript ? (
                    <button onClick={() => setOpen(o => !o)}
                        className="self-center flex items-center justify-center w-7 h-7 rounded-md transition-colors hover:bg-[rgba(232,228,221,0.08)]">
                        {open
                            ? <ChevronUp className="w-3.5 h-3.5" style={{ color: T.muted }} />
                            : <ChevronDown className="w-3.5 h-3.5" style={{ color: T.muted }} />}
                    </button>
                ) : <div />}
            </div>

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

    const downloadTextExport = useCallback(() => {
        const headers = [
            "Call Time",
            "Patient Name",
            "Mobile",
            "New or Returning",
            "Service / Reason",
            "Appointment DateTime",
            "Status",
            "Session UID",
            "Transcript",
        ]

        const escapeCsv = (value: string) => `"${(value ?? "").replace(/"/g, '""')}"`
        const lines = [
            headers.map(escapeCsv).join(","),
            ...rows.map((row) => [
                row.callTime,
                row.patientName,
                row.mobile,
                row.newOrReturning,
                row.serviceReason,
                row.appointmentDatetime,
                row.status,
                row.sessionUid,
                row.transcript,
            ].map(value => escapeCsv(value ?? "")).join(",")),
        ]

        const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        const safeName = (business?.name || "sheet-records").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
        link.href = url
        link.download = `${safeName || "sheet-records"}-text-export.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }, [business?.name, rows])

    const loadFallbackRowsFromCalls = useCallback(async () => {
        if (!business?.id) return []

        const { data, error } = await supabase
            .from("calls")
            .select("created_at, customer_phone, outcome, transcript, recording_url")
            .eq("business_id", business.id)
            .order("created_at", { ascending: false })
            .limit(50)

        if (error || !data) {
            return []
        }

        return (data as CallRecordFallback[]).map((call, index) => ({
            callTime: call.created_at ? new Date(call.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "",
            patientName: extractPatientNameFromTranscript(call.transcript) || "Unknown",
            mobile: call.customer_phone ?? "",
            newOrReturning: "",
            serviceReason: extractReasonFromTranscript(call.transcript),
            appointmentDatetime: "",
            status: call.outcome ?? "",
            sessionUid: `fallback-${index}-${call.created_at}`,
            transcript: call.transcript ?? "",
            recordingLink: call.recording_url ?? "",
        }))
    }, [business?.id])

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
            const json = await res.json() as BridgeResponse

            if (json.status !== "ok") throw new Error(json.message || "Unknown error from bridge")

            const mapped: SheetRow[] = (json.appointments ?? []).map((a) => ({
                callTime: a.callTime ?? "",
                patientName: a.patientName ?? "",
                mobile: a.mobile ?? "",
                newOrReturning: a.newOrReturning ?? "",
                serviceReason: a.reason ?? "",
                appointmentDatetime: a.appointmentDatetime ?? "",
                status: a.status ?? "",
                sessionUid: a.sessionUid ?? "",
                transcript: a.transcript ?? "",
                recordingLink: a.recordingLink ?? "",
            }))
            const finalRows = mapped.length > 0 ? mapped.reverse() : await loadFallbackRowsFromCalls()
            setRows(finalRows)
            setLastRefreshed(new Date())
        } catch (e) {
            const message = e instanceof Error ? e.message : "Failed to fetch sheet data."
            const fallbackRows = await loadFallbackRowsFromCalls()
            setRows(fallbackRows)
            setError(fallbackRows.length > 0 ? null : message)
        } finally {
            setLoading(false)
            setRefreshing(false)
            setCountdown(AUTO_REFRESH_INTERVAL / 1000)
        }
    }, [business?.name, bridgeUrl, loadFallbackRowsFromCalls])

    useEffect(() => { fetchData() }, [fetchData])

    useEffect(() => {
        const interval = setInterval(() => fetchData(true), AUTO_REFRESH_INTERVAL)
        return () => clearInterval(interval)
    }, [fetchData])

    useEffect(() => {
        if (!business?.id) return

        const channel = supabase
            .channel(`sheet-sync-${business.id}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "calls", filter: `business_id=eq.${business.id}` }, () => {
                fetchData(true)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [business?.id, fetchData])

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
            <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Owner portal</p>
                    <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                        Sheet Records
                    </h1>
                    <p className="text-[14px] mt-1" style={{ color: T.muted }}>
                        Live view of your Google Sheet â€” all call logs synced here. Downloads include text-only sheet data.
                    </p>
                </div>

                <div className="flex items-center gap-3 mt-2 shrink-0">
                    {lastRefreshed && (
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: T.muted }}>
                            <Clock className="w-3 h-3" />
                            Refreshes in {countdown}s
                        </div>
                    )}
                    <button onClick={downloadTextExport} disabled={rows.length === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all hover:opacity-80 disabled:opacity-40"
                        style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}`, fontFamily: I }}>
                        <Download className="w-3.5 h-3.5" />
                        Download text export
                    </button>
                    <button onClick={() => fetchData(true)} disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all hover:opacity-80 disabled:opacity-40"
                        style={{ background: T.goldBg, color: T.gold, border: "1px solid rgba(200,160,52,0.2)", fontFamily: I }}>
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        {refreshing ? "Refreshingâ€¦" : "Refresh"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-6 px-5 py-4 rounded-xl border text-[13px]"
                    style={{ background: "rgba(192,57,43,0.08)", borderColor: "rgba(192,57,43,0.2)", color: "#e07060" }}>
                    âš  {error}
                    {!bridgeUrl && (
                        <div className="mt-1 text-[12px]" style={{ color: T.muted }}>
                            Set <code>VITE_GOOGLE_BRIDGE_URL</code> in your <code>.env.local</code> file.
                        </div>
                    )}
                </div>
            )}

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

            <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
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
                {rows.length} record{rows.length !== 1 ? "s" : ""} Â· Last synced {lastRefreshed ? lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "â€”"}
            </p>
        </div>
    )
}
