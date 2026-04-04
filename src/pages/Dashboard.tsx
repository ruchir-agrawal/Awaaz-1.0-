import { Link } from "react-router-dom"
import { useBusinessData } from "@/hooks/useBusinessData"
import { useCallsData } from "@/hooks/useCallsData"
import { useAppointmentsData } from "@/hooks/useAppointmentsData"
import { Copy, PhoneOutgoing, Settings2, ShieldCheck, FileText, X } from "lucide-react"
import { toast } from "sonner"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { format, subDays, parseISO } from "date-fns"

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
    ok: "#4aaa78",
    surface: "#0d0d0d",
}

const inrCurrency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
})

function Spinner() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-5 h-5 rounded-full border border-t-[#c8a034] border-[rgba(232,228,221,0.08)] animate-spin" />
        </div>
    )
}

export default function Dashboard() {
    const { business, loading: bl } = useBusinessData()
    const { calls, activeCalls, loading: cl, resolveCall } = useCallsData(business?.id)
    const { todayCount, loading: al } = useAppointmentsData(business?.id)

    if (bl || cl || al) return <Spinner />
    if (!business) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <p style={{ color: T.muted, fontFamily: I }}>No business profile found.</p>
        </div>
    )

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const callsToday = calls.filter(c => new Date(c.created_at) >= todayStart)
    const completed = callsToday.filter(c => ["booked", "transferred", "failed"].includes(c.outcome))
    const successful = completed.filter(c => ["booked", "transferred"].includes(c.outcome))
    const rate = completed.length > 0 ? Math.round((successful.length / completed.length) * 100) : 0
    const revenue = todayCount * 500
    const publicUrl = `${window.location.origin}/call/${business.slug}`
    const isBusinessNew = business.created_at === business.updated_at
    const needsProfileSetup = [business.phone, business.address, business.city].some(value => !value?.trim())
    const showOnboarding = isBusinessNew || needsProfileSetup

    const chartData = Array.from({ length: 14 }).map((_, i) => {
        const d = subDays(new Date(), 13 - i)
        const ds = format(d, "MMM d")
        return { d: ds, v: calls.filter(c => format(parseISO(c.created_at), "MMM d") === ds).length }
    })

    const metrics = [
        { label: "Calls today", value: callsToday.length },
        { label: "Success rate", value: `${rate}%` },
        { label: "Booked", value: todayCount },
        { label: "Est. revenue", value: inrCurrency.format(revenue) },
    ]

    const onboardingSteps = [
        {
            icon: Settings2,
            title: "Open Settings",
            body: "Go to the settings page to start configuring your business profile.",
        },
        {
            icon: FileText,
            title: "Add Correct Details",
            body: "Enter your business details carefully and click Save Settings when everything is accurate.",
        },
        {
            icon: ShieldCheck,
            title: business.is_active ? "Admin Approved" : "Await Admin Approval",
            body: business.is_active
                ? "Your account has been reviewed and approved by the admin team."
                : "After you save your information, our admin team will review and authorize your account.",
        },
    ]

    return (
        <div style={{ fontFamily: I }}>
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Owner dashboard</p>
                    <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                        {business.name}
                    </h1>
                </div>
                <div className="flex items-center gap-2 mt-2 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[12px]" style={{ color: T.ok, fontFamily: I }}>
                        {business.is_active ? "Live" : "Offline"}
                        {activeCalls.length > 0 && ` Â· ${activeCalls.length} active`}
                    </span>
                </div>
            </div>

            {showOnboarding && (
                <div className="mb-8 rounded-xl border p-6" style={{ background: T.surface, borderColor: T.border }}>
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="mb-2 text-[11px] uppercase tracking-[0.18em]" style={{ color: T.muted }}>Getting started</p>
                            <h2 style={{ fontFamily: D, fontWeight: 700, fontSize: "1.35rem", color: T.text, letterSpacing: "-0.03em" }}>
                                Set up your business in 3 quick steps
                            </h2>
                            <p className="mt-2 max-w-2xl text-[13px]" style={{ color: T.muted }}>
                                Complete these details once so the admin team can review your business and activate your account.
                            </p>
                        </div>
                        <Link
                            to="/owner/settings"
                            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium transition-all hover:opacity-85"
                            style={{ background: T.goldBg, color: T.gold, border: "1px solid rgba(200,160,52,0.2)" }}
                        >
                            <Settings2 className="h-3.5 w-3.5" />
                            Open settings
                        </Link>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        {onboardingSteps.map((step) => (
                            <div key={step.title} className="rounded-xl border p-4" style={{ background: "#0a0a0a", borderColor: T.border }}>
                                <step.icon className="mb-3 h-4 w-4" style={{ color: T.gold }} />
                                <div className="mb-1 text-[14px] font-semibold" style={{ color: T.text }}>{step.title}</div>
                                <p className="text-[12px] leading-relaxed" style={{ color: T.muted }}>{step.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex divide-x mb-10 overflow-hidden rounded-xl border"
                style={{ borderColor: T.border, background: T.surface }}>
                {metrics.map((m, i) => (
                    <div key={i} className="flex-1 px-6 py-6 min-w-0">
                        <div style={{
                            fontFamily: D, fontWeight: 700, color: T.text,
                            fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                            letterSpacing: "-0.04em", lineHeight: 1
                        }}>
                            {m.value}
                        </div>
                        <div className="mt-2 text-[11px] uppercase tracking-[0.15em]" style={{ color: T.muted }}>
                            {m.label}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between px-5 py-4 rounded-xl mb-8 border"
                style={{ background: T.goldBg, borderColor: "rgba(200,160,52,0.15)" }}>
                <div>
                    <div className="text-[11px] uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(200,160,52,0.6)" }}>Your public voice link</div>
                    <code className="text-[13px]" style={{ color: T.gold, fontFamily: "monospace" }}>{publicUrl}</code>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("Copied!") }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all hover:opacity-80"
                    style={{ background: T.goldBg, color: T.gold, border: "1px solid rgba(200,160,52,0.2)", fontFamily: I }}>
                    <Copy className="w-3.5 h-3.5" /> Copy
                </button>
            </div>

            {activeCalls.length > 0 && (
                <div className="mb-8">
                    <p className="text-[11px] uppercase tracking-[0.15em] mb-3" style={{ color: T.muted }}>Active calls</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activeCalls.map(call => (
                            <div key={call.id} className="flex items-center justify-between px-5 py-4 rounded-xl border"
                                style={{ background: "rgba(200,160,52,0.05)", borderColor: "rgba(200,160,52,0.15)" }}>
                                <div className="flex items-center gap-3">
                                    <PhoneOutgoing className="w-4 h-4" style={{ color: T.gold }} />
                                    <div>
                                        <div className="text-[14px] font-medium" style={{ color: T.text }}>
                                            {call.customer_phone?.replace(/(\d{4})$/, "XXXX") ?? "Unknown"}
                                        </div>
                                        <div className="text-[11px] capitalize" style={{ color: T.gold }}>In progressâ€¦</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[15px] font-mono tabular-nums" style={{ color: T.muted }}>
                                        {Math.floor((call.duration_seconds ?? 0) / 60)}:{((call.duration_seconds ?? 0) % 60).toString().padStart(2, "0")}
                                    </span>
                                    <button
                                        onClick={() => resolveCall(call.id)}
                                        title="Dismiss stuck call"
                                        className="w-6 h-6 rounded-full flex items-center justify-center transition-all hover:bg-[rgba(232,228,221,0.1)]"
                                        style={{ border: "1px solid rgba(232,228,221,0.12)" }}>
                                        <X className="w-3 h-3" style={{ color: T.muted }} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border, background: T.surface }}>
                <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b" style={{ borderColor: T.border }}>
                    <div>
                        <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1rem", color: T.text }}>Call volume</div>
                        <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>Last 14 days</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-20 h-px" style={{ background: T.gold }} />
                        <span className="text-[11px]" style={{ color: T.muted }}>Total calls</span>
                    </div>
                </div>
                <div className="px-2 pt-2 pb-4 h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
                            <XAxis dataKey="d" axisLine={false} tickLine={false}
                                tick={{ fill: "rgba(232,228,221,0.25)", fontSize: 10, fontFamily: I }} dy={8} />
                            <YAxis axisLine={false} tickLine={false}
                                tick={{ fill: "rgba(232,228,221,0.25)", fontSize: 10, fontFamily: I }} />
                            <Tooltip contentStyle={{
                                background: "#111", border: "1px solid rgba(232,228,221,0.1)",
                                borderRadius: "8px", color: T.text, fontSize: 12, fontFamily: I
                            }} itemStyle={{ color: T.gold }} cursor={{ stroke: "rgba(232,228,221,0.07)" }} />
                            <Line type="monotone" dataKey="v" stroke={T.gold} strokeWidth={1.5}
                                dot={false} activeDot={{ r: 3, fill: T.gold, strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}
