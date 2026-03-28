import { useState } from "react"
import { useBusinessData } from "@/hooks/useBusinessData"
import { useCallsData } from "@/hooks/useCallsData"
import { useAppointmentsData } from "@/hooks/useAppointmentsData"
import { format, subDays, parseISO, isSameDay } from "date-fns"
import { toast } from "sonner"
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Download, Share2, Clock, Calendar, Users, BrainCircuit, PhoneCall } from "lucide-react"
import { cn } from "@/lib/utils"

const C = {
  gold: "#c9a227", goldLight: "rgba(201,162,39,0.1)", goldBorder: "rgba(201,162,39,0.18)",
  terra: "#c4643a", terraLight: "rgba(196,100,58,0.1)", terraBorder: "rgba(196,100,58,0.18)",
  text: "#f0ede8", textMuted: "rgba(240,237,232,0.4)", textGhost: "rgba(240,237,232,0.15)",
  surface: "#0f0f0f", elevated: "#141414", border: "rgba(255,255,255,0.06)",
}

const OUTCOME_COLORS: Record<string, string> = {
  booked: "#5c9e6e", transferred: "#c9a227", completed: "#4a7fa5",
  failed: "#c4643a", missed: "rgba(240,237,232,0.2)", "in-progress": "#8b6fc9"
}
const LANG_COLORS = ["#c9a227", "#c4643a", "#4a7fa5", "#5c9e6e", "#8b6fc9"]

export default function Analytics() {
  const { business } = useBusinessData()
  const { calls, loading: callsLoading } = useCallsData(business?.id)
  const { todayCount, loading: aptLoading } = useAppointmentsData(business?.id)
  const [timeRange, setTimeRange] = useState<"7" | "30">("7")

  const days = parseInt(timeRange)
  const relevantStart = subDays(new Date(), days)
  const recentCalls = calls.filter(c => new Date(c.created_at) >= relevantStart)
  const avgHandleSecs = recentCalls.length > 0
    ? Math.round(recentCalls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) / recentCalls.length) : 0

  const volumeData = Array.from({ length: days }).map((_, i) => {
    const d = subDays(new Date(), days - 1 - i)
    const dc = calls.filter(c => isSameDay(parseISO(c.created_at), d))
    return { date: format(d, "MMM dd"), answered: dc.filter(c => c.outcome !== "missed").length, missed: dc.filter(c => c.outcome === "missed").length, total: dc.length }
  })

  const outcomeCounts = recentCalls.reduce((acc, c) => { acc[c.outcome] = (acc[c.outcome] || 0) + 1; return acc }, {} as Record<string, number>)
  const outcomesData = Object.entries(outcomeCounts).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v, color: OUTCOME_COLORS[k] || "#888" })).filter(o => o.value > 0)

  const langCounts = recentCalls.reduce((acc, c) => { const l = c.language_detected || "unknown"; acc[l] = (acc[l] || 0) + 1; return acc }, {} as Record<string, number>)
  const languageData = Object.entries(langCounts).map(([k, v], i) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v, color: LANG_COLORS[i % LANG_COLORS.length] })).filter(o => o.value > 0)

  if (callsLoading || aptLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#c9a227] border-white/10 animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] tracking-[0.25em] uppercase mb-2" style={{ color: C.textMuted }}>Owner Portal</p>
          <h1 className="text-[2.2rem] leading-tight mb-1" style={{ fontFamily: "'Instrument Serif', serif", color: C.text }}>
            Analytics
          </h1>
          <p className="text-[14px]" style={{ color: C.textMuted }}>Deep dive into {business?.agent_name || "your agent"}'s metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time toggle */}
          <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: C.border, background: "rgba(255,255,255,0.03)" }}>
            {[{ label: "7 Days", value: "7" }, { label: "30 Days", value: "30" }].map(tab => (
              <button key={tab.value} onClick={() => setTimeRange(tab.value as any)}
                className={cn("px-4 py-2 text-[12px] font-medium transition-all", timeRange === tab.value ? "text-[#c9a227] bg-[rgba(201,162,39,0.1)]" : "")}
                style={{ color: timeRange === tab.value ? C.gold : C.textMuted }}>
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/call/${business?.slug}`); toast.success("Link copied") }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-[12px] transition-all hover:border-[rgba(201,162,39,0.3)]"
            style={{ borderColor: C.border, color: C.textMuted, background: "rgba(255,255,255,0.03)" }}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button onClick={() => toast.promise(new Promise(r => setTimeout(r, 2000)), { loading: "Generating…", success: "Downloaded!", error: "Failed" })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
            style={{ background: C.goldLight, color: C.gold, border: `1px solid ${C.goldBorder}` }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Insights row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Clock, label: "Avg Handle Time", value: avgHandleSecs > 0 ? `${Math.floor(avgHandleSecs / 60)}m ${avgHandleSecs % 60}s` : "—" },
          { icon: Calendar, label: "Booked Today", value: `${todayCount}` },
          { icon: Users, label: "Total Calls", value: `${recentCalls.length}` },
          { icon: PhoneCall, label: "Successful", value: `${recentCalls.filter(c => ["booked", "transferred", "completed"].includes(c.outcome)).length}` },
        ].map((item, i) => (
          <div key={i} className="rounded-2xl p-5 border" style={{ background: C.surface, borderColor: C.border }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-4" style={{ background: C.goldLight }}>
              <item.icon className="w-4 h-4" style={{ color: C.gold }} />
            </div>
            <div className="text-[1.5rem] font-bold tabular-nums" style={{ color: C.text }}>{item.value}</div>
            <div className="text-[11px] mt-1" style={{ color: C.textMuted }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Volume chart (spans 2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border p-6" style={{ background: C.surface, borderColor: C.border }}>
          <h3 className="text-[15px] font-semibold mb-1" style={{ color: C.text }}>Call Volume</h3>
          <p className="text-[12px] mb-6" style={{ color: C.textMuted }}>Daily answered vs missed breakdown</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: C.textMuted, fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: C.textMuted, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: C.elevated, border: `1px solid ${C.goldBorder}`, borderRadius: 12, color: C.text, fontSize: 13 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: C.textMuted }} />
                <Line type="monotone" name="Answered" dataKey="answered" stroke={C.gold} strokeWidth={2} dot={{ fill: C.gold, r: 3, strokeWidth: 0 }} />
                <Line type="monotone" name="Missed" dataKey="missed" stroke={C.terra} strokeWidth={2} dot={{ fill: C.terra, r: 3, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Two small pie charts stacked */}
        <div className="flex flex-col gap-6">
          {/* Outcomes pie */}
          <div className="flex-1 rounded-2xl border p-5" style={{ background: C.surface, borderColor: C.border }}>
            <h3 className="text-[14px] font-semibold mb-1" style={{ color: C.text }}>Outcomes</h3>
            <div className="h-[160px] flex items-center justify-center">
              {outcomesData.length === 0
                ? <p className="text-[12px]" style={{ color: C.textGhost }}>No data yet</p>
                : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={outcomesData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={4} dataKey="value" stroke="none">
                        {outcomesData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${v} calls`} contentStyle={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.text }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: C.textMuted }} />
                    </PieChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>
          {/* Languages pie */}
          <div className="flex-1 rounded-2xl border p-5" style={{ background: C.surface, borderColor: C.border }}>
            <h3 className="text-[14px] font-semibold mb-1" style={{ color: C.text }}>Languages</h3>
            <div className="h-[160px] flex items-center justify-center">
              {languageData.length === 0
                ? <p className="text-[12px]" style={{ color: C.textGhost }}>No data yet</p>
                : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={languageData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={4} dataKey="value" stroke="none">
                        {languageData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `${v} calls`} contentStyle={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.text }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: C.textMuted }} />
                    </PieChart>
                  </ResponsiveContainer>
                )
              }
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {calls.length === 0 && (
        <div className="rounded-2xl border px-6 py-5 flex items-center gap-4" style={{ background: "rgba(201,162,39,0.05)", borderColor: C.goldBorder }}>
          <BrainCircuit className="w-5 h-5 shrink-0" style={{ color: C.gold }} />
          <p className="text-[13px]" style={{ color: C.textMuted }}>
            <span className="font-semibold" style={{ color: C.text }}>Fresh Start — </span>
            Analytics will populate automatically once your agent starts handling calls. Share your voice link to begin.
          </p>
        </div>
      )}
    </div>
  )
}
