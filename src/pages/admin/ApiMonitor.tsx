import { Server as _S, Zap, RefreshCw, Activity } from "lucide-react"
import { useState, useEffect } from "react"

const C = {
  gold: "#c9a227", goldLight: "rgba(201,162,39,0.1)", goldBorder: "rgba(201,162,39,0.18)",
  terra: "#c4643a", terraLight: "rgba(196,100,58,0.1)", terraBorder: "rgba(196,100,58,0.18)",
  text: "#f0ede8", textMuted: "rgba(240,237,232,0.4)",
  surface: "#0f0f0f", elevated: "#141414", border: "rgba(255,255,255,0.06)",
  ok: "#5c9e6e",
}

const MOCK_LOGS = [
  { id: "req_001", endpoint: "POST /api/v1/calls/initiate", status: 200, latency: "142ms", time: "22:04:11", agent: "Shubh" },
  { id: "req_002", endpoint: "GET /api/v1/businesses/list", status: 200, latency: "38ms", time: "22:03:57", agent: "—" },
  { id: "req_003", endpoint: "POST /api/v1/appointments/book", status: 201, latency: "95ms", time: "22:03:41", agent: "Priya" },
  { id: "req_004", endpoint: "GET /api/v1/calls/history", status: 200, latency: "52ms", time: "22:03:20", agent: "—" },
  { id: "req_005", endpoint: "POST /api/v1/calls/initiate", status: 200, latency: "138ms", time: "22:02:58", agent: "Raj" },
  { id: "req_006", endpoint: "POST /api/v1/transcribe", status: 500, latency: "1.2s", time: "22:01:44", agent: "Nisha" },
  { id: "req_007", endpoint: "WS /realtime/calls", status: 101, latency: "8ms", time: "22:01:12", agent: "—" },
]

const ENDPOINTS = [
  { name: "/api/v1/calls/initiate", rpm: 42, p99: "340ms" },
  { name: "/api/v1/appointments/book", rpm: 18, p99: "190ms" },
  { name: "/api/v1/transcribe", rpm: 34, p99: "1.8s" },
  { name: "WS /realtime/calls", rpm: 88, p99: "12ms" },
]

export default function AdminApiMonitor() {
  const [ticks, setTicks] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTicks(n => n + 1), 3000)
    return () => clearInterval(t)
  }, [])

  const statusColor = (s: number) => s < 300 ? C.ok : s < 500 ? C.gold : C.terra
  const statusBg = (s: number) => s < 300 ? "rgba(92,158,110,0.1)" : s < 500 ? C.goldLight : C.terraLight

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="mb-10 flex items-end justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full mb-4"
            style={{ color: C.terra, background: C.terraLight, border: `1px solid ${C.terraBorder}` }}>
            <span className="w-1.5 h-1.5 bg-[#c4643a] rounded-full" />
            Sovereign Admin
          </span>
          <h1 className="text-[2.4rem] leading-tight mb-1" style={{ fontFamily: "'Instrument Serif', serif", color: C.text }}>
            API Monitor
          </h1>
          <p className="text-[14px]" style={{ color: C.textMuted }}>Live endpoint usage and request stream.</p>
        </div>
        <div className="flex items-center gap-2 text-[12px]" style={{ color: C.textMuted }}>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Live — updates every 3s
        </div>
      </div>

      {/* Endpoint summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {ENDPOINTS.map(ep => (
          <div key={ep.name} className="rounded-2xl border p-5" style={{ background: C.surface, borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3.5 h-3.5" style={{ color: C.gold }} />
              <span className="text-[11px] font-medium truncate" style={{ color: C.textMuted }}>{ep.name.split("/").pop()}</span>
            </div>
            <div className="text-[1.6rem] font-bold tabular-nums" style={{ color: C.text }}>{ep.rpm + (ticks % 3)}</div>
            <div className="text-[11px] mt-1" style={{ color: C.textMuted }}>req/min · p99: {ep.p99}</div>
          </div>
        ))}
      </div>

      {/* Live request log */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.border }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ background: C.elevated, borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: C.gold }} />
            <span className="text-[14px] font-semibold" style={{ color: C.text }}>Live Request Stream</span>
          </div>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: C.ok }}>
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Streaming
          </span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[120px_1fr_80px_100px_80px_80px] px-5 py-3 border-b text-[11px] font-medium uppercase tracking-[0.15em]"
          style={{ background: "rgba(255,255,255,0.01)", borderColor: C.border, color: C.textMuted }}>
          <span>ID</span><span>Endpoint</span><span>Status</span><span>Latency</span><span>Time</span><span>Agent</span>
        </div>

        {MOCK_LOGS.map((log, i) => (
          <div key={log.id}
            className="grid grid-cols-[120px_1fr_80px_100px_80px_80px] px-5 py-3.5 border-b last:border-0"
            style={{ background: i % 2 === 0 ? C.surface : "rgba(255,255,255,0.01)", borderColor: C.border }}>
            <span className="text-[11px] font-mono" style={{ color: C.textMuted }}>{log.id}</span>
            <span className="text-[12px] font-mono truncate" style={{ color: C.text }}>{log.endpoint}</span>
            <span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ color: statusColor(log.status), background: statusBg(log.status) }}>
                {log.status}
              </span>
            </span>
            <span className="text-[12px] font-mono tabular-nums" style={{ color: C.textMuted }}>{log.latency}</span>
            <span className="text-[11px] font-mono" style={{ color: C.textMuted }}>{log.time}</span>
            <span className="text-[12px]" style={{ color: log.agent !== "—" ? C.gold : C.textMuted }}>{log.agent}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
