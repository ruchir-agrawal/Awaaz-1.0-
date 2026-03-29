import { useState } from "react"
import { useBusinessData } from "@/hooks/useBusinessData"
import { useCallsData } from "@/hooks/useCallsData"
import { useAppointmentsData } from "@/hooks/useAppointmentsData"
import { format, subDays, parseISO, isSameDay } from "date-fns"
import { toast } from "sonner"
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Download, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"

const D = "'Syne', sans-serif"
const I = "'Inter', sans-serif"
const T = {
    text: "#e8e4dd", muted: "rgba(232,228,221,0.38)", ghost: "rgba(232,228,221,0.12)",
    border: "rgba(232,228,221,0.07)", borderStrong: "rgba(232,228,221,0.12)",
    gold: "#c8a034", goldBg: "rgba(200,160,52,0.07)", surface: "#0d0d0d",
    ok: "#4aaa78", ng: "#b85c35",
}

const PIE_COLORS: Record<string, string> = {
    booked: "#4aaa78", transferred: "#c8a034", completed: "#4a7fa5",
    failed: "#b85c35", missed: "rgba(232,228,221,0.15)", "in-progress": "#c8a034"
}
const LANG_COLORS = ["#c8a034", "#b85c35", "#4a7fa5", "#4aaa78", "#8b6fd0"]

export default function Analytics() {
    const { business } = useBusinessData()
    const { calls, loading: cl } = useCallsData(business?.id)
    const { todayCount, loading: al } = useAppointmentsData(business?.id)
    const [range, setRange] = useState<"7" | "30">("7")

    const days = parseInt(range)
    const start = subDays(new Date(), days)
    const recent = calls.filter(c => new Date(c.created_at) >= start)

    const avgSecs = recent.length > 0
        ? Math.round(recent.reduce((a, c) => a + (c.duration_seconds || 0), 0) / recent.length) : 0

    const volumeData = Array.from({ length: days }).map((_, i) => {
        const d = subDays(new Date(), days - 1 - i)
        const dc = calls.filter(c => isSameDay(parseISO(c.created_at), d))
        return { d: format(d, "MMM d"), total: dc.length, missed: dc.filter(c => c.outcome === "missed").length }
    })

    const outcomes = Object.entries(
        recent.reduce((a, c) => { a[c.outcome] = (a[c.outcome] || 0) + 1; return a }, {} as Record<string, number>)
    ).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v, fill: PIE_COLORS[k] || "#888" }))

    const langs = Object.entries(
        recent.reduce((a, c) => { const l = c.language_detected || "unknown"; a[l] = (a[l] || 0) + 1; return a }, {} as Record<string, number>)
    ).map(([k, v], i) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v, fill: LANG_COLORS[i % LANG_COLORS.length] }))

    if (cl || al) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-5 h-5 rounded-full border border-t-[#c8a034] border-[rgba(232,228,221,0.08)] animate-spin" />
        </div>
    )

    const insightMetrics = [
        { label: "Avg handle time", value: avgSecs > 0 ? `${Math.floor(avgSecs / 60)}m ${avgSecs % 60}s` : "—" },
        { label: "Total interactions", value: recent.length },
        { label: "Bookings today", value: todayCount },
        { label: "Resolved", value: recent.filter(c => ["booked", "transferred", "completed"].includes(c.outcome)).length },
    ]

    const tooltipStyle = {
        background: "#111", border: "1px solid rgba(232,228,221,0.1)",
        borderRadius: "8px", color: T.text, fontSize: 12, fontFamily: I
    }

    return (
        <div style={{ fontFamily: I }}>
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Analytics</p>
                    <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                        {business?.agent_name ?? "Agent"} Insights
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: T.border }}>
                        {["7", "30"].map(v => (
                            <button key={v} onClick={() => setRange(v as any)}
                                className="px-4 py-2 text-[12px] font-medium transition-all"
                                style={{ background: range === v ? "rgba(200,160,52,0.1)" : "transparent", color: range === v ? T.gold : T.muted, fontFamily: I }}>
                                {v}d
                            </button>
                        ))}
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/call/${business?.slug}`); toast.success("Link copied") }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] transition-all border"
                        style={{ borderColor: T.border, color: T.muted, fontFamily: I }}>
                        <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                    <button onClick={() => toast.promise(new Promise(r => setTimeout(r, 1500)), { loading: "Generating…", success: "Downloaded!", error: "Failed" })}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
                        style={{ background: T.goldBg, color: T.gold, border: "1px solid rgba(200,160,52,0.2)", fontFamily: I }}>
                        <Download className="w-3.5 h-3.5" /> Export
                    </button>
                </div>
            </div>

            {/* Insight metric strip */}
            <div className="flex divide-x rounded-xl border mb-8 overflow-hidden"
                style={{ borderColor: T.border, background: T.surface }}>
                {insightMetrics.map((m, i) => (
                    <div key={i} className="flex-1 px-6 py-5">
                        <div style={{ fontFamily: D, fontWeight: 700, fontSize: "2rem", color: T.text, letterSpacing: "-0.04em", lineHeight: 1 }}>
                            {m.value}
                        </div>
                        <div className="mt-2 text-[11px] uppercase tracking-[0.15em]" style={{ color: T.muted }}>{m.label}</div>
                    </div>
                ))}
            </div>

            {/* Main chart */}
            <div className="rounded-xl border overflow-hidden mb-6" style={{ borderColor: T.border, background: T.surface }}>
                <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between" style={{ borderColor: T.border }}>
                    <div>
                        <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1rem", color: T.text }}>Call volume</div>
                        <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>Total calls per day over {range} days</div>
                    </div>
                    <div className="flex items-center gap-4 text-[11px]" style={{ color: T.muted }}>
                        <span className="flex items-center gap-1.5"><span className="w-4 h-px inline-block" style={{ background: T.gold }} /> Total</span>
                        <span className="flex items-center gap-1.5"><span className="w-4 h-px inline-block" style={{ background: "#b85c35" }} /> Missed</span>
                    </div>
                </div>
                <div className="px-2 pt-2 pb-4 h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={volumeData} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
                            <XAxis dataKey="d" axisLine={false} tickLine={false}
                                tick={{ fill: "rgba(232,228,221,0.25)", fontSize: 10, fontFamily: I }} dy={8} />
                            <YAxis axisLine={false} tickLine={false}
                                tick={{ fill: "rgba(232,228,221,0.25)", fontSize: 10, fontFamily: I }} />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(232,228,221,0.06)" }} />
                            <Line type="monotone" dataKey="total" name="Total" stroke={T.gold} strokeWidth={1.5}
                                dot={false} activeDot={{ r: 3, fill: T.gold, strokeWidth: 0 }} />
                            <Line type="monotone" dataKey="missed" name="Missed" stroke="#b85c35" strokeWidth={1.5}
                                dot={false} activeDot={{ r: 3, fill: "#b85c35", strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Two pies side by side */}
            <div className="grid md:grid-cols-2 gap-6">
                {[
                    { title: "Outcome breakdown", data: outcomes, empty: "No call data yet" },
                    { title: "Language distribution", data: langs, empty: "No language data yet" },
                ].map(section => (
                    <div key={section.title} className="rounded-xl border overflow-hidden" style={{ borderColor: T.border, background: T.surface }}>
                        <div className="px-6 py-5 border-b" style={{ borderColor: T.border }}>
                            <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1rem", color: T.text }}>{section.title}</div>
                        </div>
                        <div className="p-4">
                            {section.data.length === 0 ? (
                                <div className="h-[180px] flex items-center justify-center">
                                    <p className="text-[13px]" style={{ color: T.muted }}>{section.empty}</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 h-[180px] w-[180px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={section.data} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                                                    paddingAngle={3} dataKey="value" stroke="none">
                                                    {section.data.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                                </Pie>
                                                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${v} calls`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        {section.data.map((e, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: e.fill }} />
                                                    <span className="text-[12px]" style={{ color: T.muted }}>{e.name}</span>
                                                </div>
                                                <span className="text-[13px] font-semibold tabular-nums" style={{ color: T.text }}>{e.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
