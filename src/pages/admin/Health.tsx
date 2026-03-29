import { CheckCircle2, Database, Globe, Cpu, Wifi, Clock } from "lucide-react"

const D = "'Syne', sans-serif"
const I = "'Inter', sans-serif"
const T = {
    text: "#e8e4dd", muted: "rgba(232,228,221,0.38)", ghost: "rgba(232,228,221,0.1)",
    border: "rgba(232,228,221,0.07)", gold: "#c8a034", goldBg: "rgba(200,160,52,0.07)",
    terra: "#b85c35", terraBg: "rgba(184,92,53,0.08)", surface: "#0d0d0d", ok: "#4aaa78",
}

const SERVICES = [
    { name: "Supabase DB", desc: "PostgreSQL · hosted • India West", icon: Database, lat: "4ms", up: 99.97 },
    { name: "Supabase Auth", desc: "JWT authentication service", icon: CheckCircle2, lat: "6ms", up: 99.99 },
    { name: "Supabase Realtime", desc: "WebSocket event bus", icon: Wifi, lat: "12ms", up: 99.91 },
]

const PROVIDERS = [
    { name: "Groq (LPU)", desc: "Llama 3 · primary LLM", icon: Cpu, lat: "140ms", up: 99.8 },
    { name: "xAI Grok", desc: "Grok-Beta · fallback reasoning", icon: Globe, lat: "850ms", up: 99.2 },
    { name: "Sarvam AI (TTS)", desc: "Hindi & regional speech", icon: Globe, lat: "320ms", up: 98.9 },
    { name: "Sarvam AI (STT)", desc: "Transcription · multilingual", icon: Globe, lat: "280ms", up: 98.9 },
]

function ServiceRow({ name, desc, icon: Icon, lat, up }: any) {
    const width = `${up}%`
    const barColor = up >= 99.5 ? "#4aaa78" : up >= 98 ? "#c8a034" : "#b85c35"
    return (
        <div className="py-4 border-b last:border-0" style={{ borderColor: T.border }}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ borderColor: T.border }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: barColor }} />
                    </div>
                    <div>
                        <div className="text-[14px] font-medium" style={{ color: T.text }}>{name}</div>
                        <div className="text-[11px]" style={{ color: T.muted }}>{desc}</div>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ color: barColor, background: barColor === "#4aaa78" ? "rgba(74,170,120,0.09)" : barColor === "#c8a034" ? T.goldBg : T.terraBg }}>
                        {up}%
                    </span>
                    <div className="text-[11px] font-mono mt-1" style={{ color: T.muted }}>{lat}</div>
                </div>
            </div>
            <div className="flex gap-0.5 h-1 rounded-full overflow-hidden" style={{ background: "rgba(232,228,221,0.06)" }}>
                <div className="h-full rounded-full transition-all" style={{ width, background: barColor, opacity: 0.7 }} />
            </div>
        </div>
    )
}

export default function AdminHealth() {
    return (
        <div style={{ fontFamily: I }}>
            <div className="mb-8">
                <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Admin console</p>
                <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                    System health
                </h1>
                <p className="text-[14px] mt-1" style={{ color: T.muted }}>Real-time infrastructure monitoring.</p>
            </div>

            {/* Overall banner */}
            <div className="flex items-center gap-4 px-5 py-4 rounded-xl border mb-8"
                style={{ background: "rgba(74,170,120,0.05)", borderColor: "rgba(74,170,120,0.2)" }}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                    <span className="text-[15px] font-semibold" style={{ color: T.text }}>All systems operational</span>
                    <span className="text-[12px] ml-3" style={{ color: T.muted }}>No incidents in last 24h</span>
                </div>
                <div className="ml-auto flex items-center gap-1.5 text-[12px]" style={{ color: T.muted }}>
                    <Clock className="w-3.5 h-3.5" />
                    Updated just now
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border, background: T.surface }}>
                    <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: T.border }}>
                        <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1rem", color: T.text }}>Core infrastructure</div>
                        <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>Database, auth, and realtime</div>
                    </div>
                    <div className="px-6">
                        {SERVICES.map(s => <ServiceRow key={s.name} {...s} />)}
                    </div>
                </div>

                <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border, background: T.surface }}>
                    <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: T.border }}>
                        <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1rem", color: T.text }}>AI providers</div>
                        <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>LLM, TTS, and STT services</div>
                    </div>
                    <div className="px-6">
                        {PROVIDERS.map(s => <ServiceRow key={s.name} {...s} />)}
                    </div>
                </div>
            </div>
        </div>
    )
}
