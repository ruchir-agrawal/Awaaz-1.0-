import { useBusinessData } from "@/hooks/useBusinessData"
import { useCallsData } from "@/hooks/useCallsData"
import { useAppointmentsData } from "@/hooks/useAppointmentsData"
import { PhoneOutgoing, CalendarCheck, CheckCircle2, IndianRupee, Copy, PhoneCall, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { format, subDays, parseISO } from "date-fns"

const C = {
  gold: "#c9a227",
  goldLight: "rgba(201,162,39,0.12)",
  goldBorder: "rgba(201,162,39,0.18)",
  text: "#f0ede8",
  textMuted: "rgba(240,237,232,0.4)",
  surface: "#0f0f0f",
  elevated: "#141414",
  border: "rgba(255,255,255,0.06)",
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-10">
      <p className="text-[11px] tracking-[0.25em] uppercase mb-2" style={{ color: C.textMuted }}>
        Owner Portal
      </p>
      <h1 className="text-[2.2rem] leading-tight" style={{ fontFamily: "'Instrument Serif', serif", color: C.text }}>
        {title}
      </h1>
      <p className="text-[14px] mt-1" style={{ color: C.textMuted }}>{subtitle}</p>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, delta }: { title: string; value: string | number; icon: any; delta?: string }) {
  return (
    <div className="rounded-2xl p-6 border transition-colors hover:border-[rgba(201,162,39,0.2)]"
      style={{ background: C.surface, borderColor: C.border }}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.goldLight }}>
          <Icon className="w-4 h-4" style={{ color: C.gold }} />
        </div>
        {delta && (
          <span className="text-[11px] font-medium flex items-center gap-1 text-emerald-400">
            <TrendingUp className="w-3 h-3" /> {delta}
          </span>
        )}
      </div>
      <div className="text-[2rem] font-bold leading-none mb-1.5 tabular-nums" style={{ color: C.text }}>{value}</div>
      <div className="text-[12px]" style={{ color: C.textMuted }}>{title}</div>
    </div>
  )
}

export default function Dashboard() {
  const { business, loading: bizLoading } = useBusinessData()
  const { calls, activeCalls, loading: callsLoading } = useCallsData(business?.id)
  const { todayCount, loading: aptLoading } = useAppointmentsData(business?.id)

  if (bizLoading || callsLoading || aptLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-[#c9a227] border-white/10 animate-spin" />
          <span className="text-[13px]" style={{ color: "rgba(240,237,232,0.3)" }}>Loading your dashboard…</span>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-[1.5rem] mb-2" style={{ fontFamily: "'Instrument Serif', serif", color: "rgba(240,237,232,0.4)" }}>
            No business profile found.
          </div>
          <p className="text-[13px]" style={{ color: "rgba(240,237,232,0.25)" }}>
            Complete your setup in Settings to get started.
          </p>
        </div>
      </div>
    )
  }

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const callsToday = calls.filter(c => new Date(c.created_at) >= todayStart)
  const completedToday = callsToday.filter(c => ["booked", "transferred", "failed"].includes(c.outcome))
  const successfulToday = completedToday.filter(c => ["booked", "transferred"].includes(c.outcome))
  const successRate = completedToday.length > 0 ? Math.round((successfulToday.length / completedToday.length) * 100) : 0
  const revenue = todayCount * 500
  const publicUrl = `${window.location.origin}/call/${business.slug}`

  const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i))
  const chartData = last7Days.map(date => {
    const ds = format(date, "MMM dd")
    return { name: ds, calls: calls.filter(c => format(parseISO(c.created_at), "MMM dd") === ds).length }
  })

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <PageHeader
        title={`${business.name}`}
        subtitle="Your AI receptionist performance at a glance."
      />

      {/* Agent status / voice link banner */}
      <div className="rounded-2xl border p-5 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{ background: C.elevated, borderColor: C.goldBorder }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(201,162,39,0.1)" }}>
            <PhoneCall className="w-4 h-4" style={{ color: C.gold }} />
          </div>
          <div>
            <p className="text-[13px] font-medium" style={{ color: C.text }}>Your Public Voice Link</p>
            <p className="text-[11px]" style={{ color: C.textMuted }}>Share with customers to connect to {business.agent_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 border text-[12px] font-mono"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: C.border, color: C.textMuted }}>
          <span className="truncate max-w-[220px]">{publicUrl}</span>
          <button onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Link copied!") }}
            className="ml-1 hover:text-[#c9a227] transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[12px]" style={{ color: "rgba(240,237,232,0.4)" }}>
            {business.is_active ? "Agent Online" : "Agent Offline"}
            {activeCalls.length > 0 && ` · ${activeCalls.length} live`}
          </span>
        </div>
      </div>

      {/* Active calls */}
      {activeCalls.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCalls.map(call => (
            <div key={call.id} className="rounded-2xl p-4 border flex items-center justify-between animate-pulse"
              style={{ background: "rgba(201,162,39,0.06)", borderColor: "rgba(201,162,39,0.2)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(201,162,39,0.15)" }}>
                  <PhoneOutgoing className="w-4 h-4" style={{ color: C.gold }} />
                </div>
                <div>
                  <p className="text-[13px] font-medium" style={{ color: C.text }}>
                    {call.customer_phone?.replace(/(\d{4})$/, "XXXX") ?? "Unknown"}
                  </p>
                  <p className="text-[11px] capitalize" style={{ color: C.gold }}>{call.outcome}…</p>
                </div>
              </div>
              <span className="text-[15px] font-mono tabular-nums" style={{ color: C.textMuted }}>
                {Math.floor((call.duration_seconds ?? 0) / 60)}:{((call.duration_seconds ?? 0) % 60).toString().padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Calls Today" value={callsToday.length} icon={PhoneOutgoing} />
        <MetricCard title="Booked Today" value={todayCount} icon={CalendarCheck} />
        <MetricCard title="Success Rate" value={`${successRate}%`} icon={CheckCircle2} />
        <MetricCard title="Revenue (Est.)" value={`₹${revenue.toLocaleString("en-IN")}`} icon={IndianRupee} />
      </div>

      {/* Chart */}
      <div className="rounded-2xl border p-6" style={{ background: C.surface, borderColor: C.border }}>
        <div className="mb-6">
          <h2 className="text-[16px] font-semibold" style={{ color: C.text }}>Call Volume — Last 7 Days</h2>
          <p className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>Daily call traffic handled by your AI agent.</p>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a227" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#c9a227" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "rgba(240,237,232,0.3)", fontSize: 11 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(240,237,232,0.3)", fontSize: 11 }} />
              <RechartsTooltip
                contentStyle={{ background: "#141414", border: "1px solid rgba(201,162,39,0.2)", borderRadius: "12px", color: "#f0ede8", fontSize: 13 }}
                itemStyle={{ color: "#c9a227" }}
              />
              <Area type="monotone" dataKey="calls" stroke="#c9a227" strokeWidth={2} fill="url(#goldGrad)" dot={{ fill: "#c9a227", r: 3, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
