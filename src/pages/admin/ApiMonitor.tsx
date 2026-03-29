import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"

const D = "'Syne', sans-serif"
const I = "'Inter', sans-serif"
const T = {
    text: "#e8e4dd", muted: "rgba(232,228,221,0.38)", ghost: "rgba(232,228,221,0.1)",
    border: "rgba(232,228,221,0.07)", gold: "#c8a034", goldBg: "rgba(200,160,52,0.07)",
    terra: "#b85c35", terraBg: "rgba(184,92,53,0.08)", surface: "#0d0d0d", ok: "#4aaa78",
}

const BASE_LOGS = [
    { id: "req_001", method: "POST", endpoint: "/api/v1/calls/initiate", status: 200, ms: 142, agent: "Shubh", time: "02:47:11" },
    { id: "req_002", method: "GET", endpoint: "/api/v1/businesses/list", status: 200, ms: 38, agent: "—", time: "02:46:57" },
    { id: "req_003", method: "POST", endpoint: "/api/v1/appointments/book", status: 201, ms: 95, agent: "Priya", time: "02:46:41" },
    { id: "req_004", method: "GET", endpoint: "/api/v1/calls/history", status: 200, ms: 52, agent: "—", time: "02:45:20" },
    { id: "req_005", method: "POST", endpoint: "/api/v1/calls/initiate", status: 200, ms: 138, agent: "Raj", time: "02:44:58" },
    { id: "req_006", method: "POST", endpoint: "/api/v1/transcribe", status: 500, ms: 1200, agent: "Nisha", time: "02:43:44" },
    { id: "req_007", method: "WS", endpoint: "/realtime/calls", status: 101, ms: 8, agent: "—", time: "02:42:12" },
    { id: "req_008", method: "POST", endpoint: "/api/v1/tts", status: 200, ms: 312, agent: "Shubh", time: "02:42:08" },
]

const ENDPOINTS = [
    { name: "/calls/initiate", rpm: 42, p99: "340ms", ok: true },
    { name: "/appointments/book", rpm: 18, p99: "190ms", ok: true },
    { name: "/transcribe", rpm: 34, p99: "1.8s", ok: false },
    { name: "/tts", rpm: 61, p99: "420ms", ok: true },
]

export default function AdminApiMonitor() {
    const [tick, setTick] = useState(0)
    useEffect(() => { const t = setInterval(() => setTick(n => n + 1), 2000); return () => clearInterval(t) }, [])

    const statusColor = (s: number) => s < 300 ? T.ok : s < 500 ? T.gold : T.terra
    const statusBg = (s: number) => s < 300 ? "rgba(74,170,120,0.09)" : s < 500 ? T.goldBg : T.terraBg

    const methodColor = (m: string) => m === "GET" ? "#4a7fa5" : m === "POST" ? T.gold : m === "WS" ? "#8b6fd0" : T.muted

    return (
        <div style={{ fontFamily: I }}>
            <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Admin console</p>
                    <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                        API monitor
                    </h1>
                </div>
                <div className="flex items-center gap-2 text-[12px]" style={{ color: T.muted }}>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Live stream
                </div>
            </div>

            {/* Endpoint stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {ENDPOINTS.map((ep, i) => (
                    <div key={i} className="rounded-xl border p-4" style={{ background: T.surface, borderColor: T.border }}>
                        <div className="text-[10px] font-mono mb-3 truncate" style={{ color: T.muted }}>{ep.name}</div>
                        <div style={{ fontFamily: D, fontWeight: 700, fontSize: "1.8rem", color: T.text, letterSpacing: "-0.04em", lineHeight: 1 }}>
                            {ep.rpm + (tick % 4)}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest mt-1.5" style={{ color: T.muted }}>rpm</div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: T.border }}>
                            <span className="text-[11px] font-mono" style={{ color: T.muted }}>p99 {ep.p99}</span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ color: ep.ok ? T.ok : T.terra, background: ep.ok ? "rgba(74,170,120,0.09)" : T.terraBg }}>
                                {ep.ok ? "OK" : "Degraded"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Request log */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
                <div className="px-5 py-4 border-b flex items-center justify-between" style={{ background: T.surface, borderColor: T.border }}>
                    <div>
                        <span style={{ fontFamily: D, fontWeight: 600, fontSize: "1rem", color: T.text }}>Request stream</span>
                        <span className="ml-3 text-[11px]" style={{ color: T.ok }}>● Live</span>
                    </div>
                </div>
                <div className="grid px-5 py-2.5 border-b text-[10px] uppercase tracking-[0.18em]"
                    style={{ gridTemplateColumns: "90px 50px 1fr 70px 80px 90px 72px", background: "#0a0a0a", borderColor: T.border, color: T.muted }}>
                    <span>ID</span><span>Method</span><span>Endpoint</span><span>Status</span><span>Latency</span><span>Time</span><span>Agent</span>
                </div>
                {BASE_LOGS.map((log, idx) => (
                    <div key={log.id} className="grid px-5 py-3.5 border-b last:border-0"
                        style={{ gridTemplateColumns: "90px 50px 1fr 70px 80px 90px 72px", background: idx % 2 === 0 ? "#0a0a0a" : "#090909", borderColor: T.border }}>
                        <span className="text-[11px] font-mono" style={{ color: T.muted }}>{log.id}</span>
                        <span className="text-[11px] font-mono font-semibold self-center" style={{ color: methodColor(log.method) }}>{log.method}</span>
                        <span className="text-[12px] font-mono truncate self-center" style={{ color: T.text }}>{log.endpoint}</span>
                        <span className="self-center">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                                style={{ color: statusColor(log.status), background: statusBg(log.status) }}>
                                {log.status}
                            </span>
                        </span>
                        <span className="text-[12px] font-mono self-center tabular-nums" style={{ color: log.ms > 500 ? T.terra : T.muted }}>
                            {log.ms}ms
                        </span>
                        <span className="text-[11px] font-mono self-center" style={{ color: T.muted }}>{log.time}</span>
                        <span className="text-[12px] self-center" style={{ color: log.agent !== "—" ? T.gold : T.muted }}>{log.agent}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
