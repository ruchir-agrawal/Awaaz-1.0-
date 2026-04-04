import { useAdminData } from "@/hooks/useAdminData"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { format, subDays } from "date-fns"

const D = "'Syne', sans-serif"
const I = "'Inter', sans-serif"
const T = {
    text: "#e8e4dd", muted: "rgba(232,228,221,0.38)", ghost: "rgba(232,228,221,0.1)",
    border: "rgba(232,228,221,0.07)", gold: "#c8a034", goldBg: "rgba(200,160,52,0.07)",
    terra: "#b85c35", terraBg: "rgba(184,92,53,0.08)", surface: "#0d0d0d", ok: "#4aaa78",
}

export default function AdminDashboard() {
    const { owners, totalCallsToday, totalAppointmentsToday, totalCostToday, loading } = useAdminData()

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-5 h-5 rounded-full border border-t-[#b85c35] border-[rgba(232,228,221,0.08)] animate-spin" />
        </div>
    )

    const metrics = [
        { label: "Active tenants", value: owners.length },
        { label: "Calls today", value: totalCallsToday },
        { label: "Bookings today", value: totalAppointmentsToday },
        { label: "API spend", value: `₹${totalCostToday.toFixed(2)}` },
    ]

    const barData = Array.from({ length: 7 }).map((_, i) => ({ d: format(subDays(new Date(), 6 - i), "MMM d"), v: Math.floor(Math.random() * 40 + 10) }))

    return (
        <div style={{ fontFamily: I }}>
            <div className="mb-8">
                <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Admin console</p>
                <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                    Platform overview
                </h1>
            </div>

            {/* Metric strip */}
            <div className="flex divide-x rounded-xl border mb-8 overflow-hidden"
                style={{ borderColor: T.border, background: T.surface }}>
                {metrics.map((m, i) => (
                    <div key={i} className="flex-1 px-6 py-6">
                        <div style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,3rem)", color: T.text, letterSpacing: "-0.04em", lineHeight: 1 }}>
                            {m.value}
                        </div>
                        <div className="mt-2 text-[11px] uppercase tracking-[0.15em]" style={{ color: T.muted }}>{m.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
                {/* Bar chart */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border, background: T.surface }}>
                    <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: T.border }}>
                        <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1rem", color: T.text }}>Platform calls</div>
                        <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>Last 7 days across all tenants</div>
                    </div>
                    <div className="px-2 pt-3 pb-3 h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 4, right: 12, left: -24, bottom: 0 }} barCategoryGap="40%">
                                <XAxis dataKey="d" axisLine={false} tickLine={false}
                                    tick={{ fill: "rgba(232,228,221,0.25)", fontSize: 10, fontFamily: I }} dy={8} />
                                <YAxis axisLine={false} tickLine={false}
                                    tick={{ fill: "rgba(232,228,221,0.25)", fontSize: 10, fontFamily: I }} />
                                <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(232,228,221,0.1)", borderRadius: "8px", color: T.text, fontSize: 12, fontFamily: I }}
                                    itemStyle={{ color: T.terra }} cursor={{ fill: "rgba(232,228,221,0.03)" }} />
                                <Bar dataKey="v" name="Calls" fill={T.terra} radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tenant list */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border, background: T.surface }}>
                    <div className="px-6 py-5 border-b" style={{ borderColor: T.border }}>
                        <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1rem", color: T.text }}>Recent tenants</div>
                    </div>
                    {owners.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-[13px]" style={{ color: T.muted }}>No tenants yet.</p>
                        </div>
                    ) : owners.slice(0, 7).map((o, idx) => (
                        <div key={o.id} className="flex items-center justify-between px-6 py-3.5 border-b last:border-0"
                            style={{ borderColor: T.border, background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.005)" }}>
                            <div>
                                <div className="text-[13px] font-medium" style={{ color: T.text }}>{o.full_name || "—"}</div>
                                <div className="text-[11px]" style={{ color: T.muted }}>{o.email}</div>
                            </div>
                            <span className="flex items-center gap-1.5 text-[11px]" style={{ color: T.ok }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
