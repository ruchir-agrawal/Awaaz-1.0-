import { ActivitySquare, Server, CheckCircle2, Database, Globe, Cpu } from "lucide-react"

const C = {
  gold: "#c9a227", goldLight: "rgba(201,162,39,0.1)", goldBorder: "rgba(201,162,39,0.18)",
  terra: "#c4643a", terraLight: "rgba(196,100,58,0.1)", terraBorder: "rgba(196,100,58,0.18)",
  text: "#f0ede8", textMuted: "rgba(240,237,232,0.4)",
  surface: "#0f0f0f", elevated: "#141414", border: "rgba(255,255,255,0.06)",
  ok: "#5c9e6e", okBg: "rgba(92,158,110,0.1)",
}

const services = [
  { name: "Supabase DB", desc: "PostgreSQL database", icon: Database, latency: "4ms", status: "Operational" },
  { name: "Supabase Auth", desc: "Authentication service", icon: CheckCircle2, latency: "6ms", status: "Operational" },
  { name: "Supabase Realtime", desc: "Websocket events", icon: Globe, latency: "12ms", status: "Operational" },
]

const providers = [
  { name: "Groq (LPU)", desc: "Primary LLM — ultra-fast inference", latency: "140ms", icon: Cpu, status: "Operational" },
  { name: "xAI Grok", desc: "Fallback reasoning model", latency: "850ms", icon: Server, status: "Operational" },
  { name: "Gemini Pro", desc: "Multimodal capabilities", latency: "1.2s", icon: Globe, status: "Operational" },
  { name: "Sarvam AI (TTS)", desc: "Hindi & Vernacular speech", latency: "320ms", icon: ActivitySquare, status: "Operational" },
]

function ServiceRow({ name, desc, icon: Icon, latency, status }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border transition-colors hover:border-[rgba(92,158,110,0.2)]"
      style={{ background: "rgba(92,158,110,0.03)", borderColor: C.border }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.okBg }}>
          <Icon className="w-4 h-4" style={{ color: C.ok }} />
        </div>
        <div>
          <div className="text-[13px] font-medium" style={{ color: C.text }}>{name}</div>
          <div className="text-[11px]" style={{ color: C.textMuted }}>{desc}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[12px] font-mono tabular-nums" style={{ color: C.textMuted }}>{latency}</span>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ color: C.ok, background: C.okBg }}>
          {status}
        </span>
      </div>
    </div>
  )
}

export default function AdminHealth() {
  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="mb-10">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full mb-4"
          style={{ color: C.terra, background: C.terraLight, border: `1px solid ${C.terraBorder}` }}>
          <span className="w-1.5 h-1.5 bg-[#c4643a] rounded-full" />
          Sovereign Admin
        </span>
        <h1 className="text-[2.4rem] leading-tight mb-1" style={{ fontFamily: "'Instrument Serif', serif", color: C.text }}>
          System Health
        </h1>
        <p className="text-[14px]" style={{ color: C.textMuted }}>Real-time infrastructure monitoring.</p>
      </div>

      {/* Overall status banner */}
      <div className="rounded-2xl border p-5 mb-8 flex items-center gap-4"
        style={{ background: "rgba(92,158,110,0.06)", borderColor: "rgba(92,158,110,0.2)" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.okBg }}>
          <CheckCircle2 className="w-5 h-5" style={{ color: C.ok }} />
        </div>
        <div>
          <div className="text-[15px] font-semibold" style={{ color: C.text }}>All Systems Operational</div>
          <div className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>No incidents in the last 24 hours. Uptime: 99.97%</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Core Services */}
        <div className="rounded-2xl border p-6" style={{ background: C.surface, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-6">
            <ActivitySquare className="w-4 h-4" style={{ color: C.terra }} />
            <h2 className="text-[15px] font-semibold" style={{ color: C.text }}>Core Services</h2>
          </div>
          <div className="space-y-3">
            {services.map(s => <ServiceRow key={s.name} {...s} />)}
          </div>
        </div>

        {/* AI Providers */}
        <div className="rounded-2xl border p-6" style={{ background: C.surface, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-6">
            <Server className="w-4 h-4" style={{ color: C.gold }} />
            <h2 className="text-[15px] font-semibold" style={{ color: C.text }}>AI Providers</h2>
          </div>
          <div className="space-y-3">
            {providers.map(s => <ServiceRow key={s.name} {...s} />)}
          </div>
        </div>
      </div>

      {/* Simulated uptime bars */}
      <div className="rounded-2xl border p-6 mt-6" style={{ background: C.surface, borderColor: C.border }}>
        <h2 className="text-[15px] font-semibold mb-5" style={{ color: C.text }}>90-Day Uptime</h2>
        <div className="space-y-4">
          {["Supabase DB", "Groq", "Sarvam AI", "API Gateway"].map(name => (
            <div key={name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px]" style={{ color: C.textMuted }}>{name}</span>
                <span className="text-[12px] font-semibold" style={{ color: C.ok }}>99.9%</span>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: 90 }).map((_, i) => (
                  <div key={i} className="flex-1 h-6 rounded-sm transition-colors"
                    style={{ background: Math.random() > 0.02 ? "rgba(92,158,110,0.5)" : "rgba(196,100,58,0.5)" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
