import { useAdminData } from "@/hooks/useAdminData"
import { Users, PhoneCall, CalendarCheck, IndianRupee, Activity, TrendingUp } from "lucide-react"

const C = {
  gold: "#c9a227", goldLight: "rgba(201,162,39,0.1)", goldBorder: "rgba(201,162,39,0.18)",
  terra: "#c4643a", terraLight: "rgba(196,100,58,0.1)", terraBorder: "rgba(196,100,58,0.18)",
  text: "#f0ede8", textMuted: "rgba(240,237,232,0.4)", textGhost: "rgba(240,237,232,0.08)",
  surface: "#0f0f0f", elevated: "#141414", border: "rgba(255,255,255,0.06)",
}

function MandalaDecor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none">
      <circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <circle cx="60" cy="60" r="44" stroke="currentColor" strokeWidth="0.5" opacity="0.25" />
      <circle cx="60" cy="60" r="28" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 45 * Math.PI) / 180
        return <line key={i} x1={60 + Math.cos(a) * 10} y1={60 + Math.sin(a) * 10} x2={60 + Math.cos(a) * 57} y2={60 + Math.sin(a) * 57} stroke="currentColor" strokeWidth="0.4" opacity="0.25" />
      })}
    </svg>
  )
}

export default function AdminDashboard() {
  const { owners, totalCallsToday, totalAppointmentsToday, totalCostToday, loading } = useAdminData()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#c4643a] border-white/10 animate-spin" />
      </div>
    )
  }

  const stats = [
    { label: "Active Tenants", value: owners.length, icon: Users, color: C.gold, bg: C.goldLight, desc: "Registered business owners" },
    { label: "Platform Calls Today", value: totalCallsToday, icon: PhoneCall, color: "#4a7fa5", bg: "rgba(74,127,165,0.1)", desc: "Across all agents" },
    { label: "Bookings Today", value: totalAppointmentsToday, icon: CalendarCheck, color: "#5c9e6e", bg: "rgba(92,158,110,0.1)", desc: "Successful conversions" },
    { label: "API Spend Today", value: `₹${totalCostToday.toFixed(2)}`, icon: IndianRupee, color: C.terra, bg: C.terraLight, desc: "Estimated compute cost" },
  ]

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <div className="mb-10 relative overflow-hidden">
        <MandalaDecor className="absolute -right-8 -top-8 w-48 h-48 text-[rgba(201,162,39,0.07)] pointer-events-none" />
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full mb-4"
          style={{ color: C.terra, background: C.terraLight, border: `1px solid ${C.terraBorder}` }}>
          <span className="w-1.5 h-1.5 bg-[#c4643a] rounded-full" />
          Sovereign Admin
        </span>
        <h1 className="text-[2.4rem] leading-tight mb-1" style={{ fontFamily: "'Instrument Serif', serif", color: C.text }}>
          Platform Overview
        </h1>
        <p className="text-[14px]" style={{ color: C.textMuted }}>Global statistics for Awaaz Core operation.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border p-6 relative overflow-hidden group"
            style={{ background: C.surface, borderColor: C.border }}>
            <div className="absolute bottom-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: s.color }}>
              <MandalaDecor className="w-full h-full" />
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: s.bg }}>
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div className="text-[2rem] font-bold tabular-nums leading-none mb-1.5" style={{ color: C.text }}>{s.value}</div>
            <div className="text-[11px]" style={{ color: C.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Platform health strip */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border p-6" style={{ background: C.surface, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-4 h-4" style={{ color: C.terra }} />
            <h2 className="text-[15px] font-semibold" style={{ color: C.text }}>Recent Tenant Activity</h2>
          </div>
          {owners.slice(0, 5).map((owner) => (
            <div key={owner.id} className="flex items-center justify-between py-3 border-b last:border-0"
              style={{ borderColor: C.border }}>
              <div>
                <div className="text-[13px] font-medium" style={{ color: C.text }}>{owner.full_name || owner.email || "Unknown"}</div>
                <div className="text-[11px]" style={{ color: C.textMuted }}>{owner.email}</div>
              </div>
              <span className="flex items-center gap-1.5 text-[11px]"
                style={{ color: "#5c9e6e" }}>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Active
              </span>
            </div>
          ))}
          {owners.length === 0 && (
            <div className="flex items-center justify-center h-32" style={{ color: C.textMuted }}>
              <p className="text-[13px]">No tenants registered yet.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border p-6" style={{ background: C.surface, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4" style={{ color: C.gold }} />
            <h2 className="text-[15px] font-semibold" style={{ color: C.text }}>Platform Metrics</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: "Avg. Calls / Tenant", value: owners.length > 0 ? (totalCallsToday / owners.length).toFixed(1) : "—" },
              { label: "Avg. Bookings / Tenant", value: owners.length > 0 ? (totalAppointmentsToday / owners.length).toFixed(1) : "—" },
              { label: "Cost per Call", value: totalCallsToday > 0 ? `₹${(totalCostToday / totalCallsToday).toFixed(3)}` : "—" },
              { label: "System Status", value: "Operational" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0"
                style={{ borderColor: C.border }}>
                <span className="text-[13px]" style={{ color: C.textMuted }}>{item.label}</span>
                <span className="text-[13px] font-semibold tabular-nums" style={{ color: C.text }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
