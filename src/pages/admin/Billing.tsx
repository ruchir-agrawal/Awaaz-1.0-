const D = "'Syne', sans-serif"
const I = "'Inter', sans-serif"
const T = {
    text: "#e8e4dd", muted: "rgba(232,228,221,0.38)", ghost: "rgba(232,228,221,0.1)",
    border: "rgba(232,228,221,0.07)", gold: "#c8a034", goldBg: "rgba(200,160,52,0.07)",
    terra: "#b85c35", terraBg: "rgba(184,92,53,0.08)", surface: "#0d0d0d", ok: "#4aaa78",
}

const PLANS = [
    { name: "Starter", price: 999, tenants: 3, desc: "Single agent · 500 calls/mo" },
    { name: "Growth", price: 2499, tenants: 8, desc: "3 agents · 2,000 calls/mo · analytics", highlight: true },
    { name: "Enterprise", price: 7999, tenants: 2, desc: "Unlimited agents · custom prompts · SLA" },
]

const TRANSACTIONS = [
    { owner: "Dr. Ananya Kapoor", plan: "Growth", amount: 2499, date: "Mar 28", status: "paid" },
    { owner: "Raj Sharma Auto", plan: "Starter", amount: 999, date: "Mar 27", status: "paid" },
    { owner: "Luxe Beauty Salon", plan: "Enterprise", amount: 7999, date: "Mar 25", status: "paid" },
    { owner: "Gupta Real Estate", plan: "Growth", amount: 2499, date: "Mar 22", status: "due" },
    { owner: "City Diagnostics", plan: "Starter", amount: 999, date: "Mar 18", status: "paid" },
]

export default function AdminBilling() {
    const mrr = PLANS.reduce((a, p) => a + p.price * p.tenants, 0)
    const arr = mrr * 12

    return (
        <div style={{ fontFamily: I }}>
            <div className="mb-8">
                <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Admin console</p>
                <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                    Billing & revenue
                </h1>
            </div>

            {/* Revenue metric strip */}
            <div className="flex divide-x rounded-xl border mb-8 overflow-hidden"
                style={{ borderColor: `rgba(200,160,52,0.2)`, background: "rgba(200,160,52,0.04)" }}>
                {[
                    { label: "Monthly recurring", value: `₹${mrr.toLocaleString("en-IN")}` },
                    { label: "Annual recurring", value: `₹${(arr / 100000).toFixed(1)}L` },
                    { label: "Paying tenants", value: PLANS.reduce((a, p) => a + p.tenants, 0) },
                    { label: "MoM growth", value: "↑ 18%" },
                ].map((m, i) => (
                    <div key={i} className="flex-1 px-6 py-5">
                        <div style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.5rem,2.5vw,2.2rem)", color: T.text, letterSpacing: "-0.04em", lineHeight: 1 }}>
                            {m.value}
                        </div>
                        <div className="mt-2 text-[11px] uppercase tracking-[0.15em]" style={{ color: T.muted }}>{m.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-[1fr_340px] gap-6">
                {/* Transactions */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
                    <div className="px-6 py-5 border-b" style={{ background: T.surface, borderColor: T.border }}>
                        <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1rem", color: T.text }}>Transactions</div>
                        <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>Recent payments from tenants</div>
                    </div>
                    <div className="grid px-5 py-2.5 border-b text-[10px] uppercase tracking-[0.18em]"
                        style={{ gridTemplateColumns: "1.5fr 80px 90px 100px 70px", background: "#0a0a0a", borderColor: T.border, color: T.muted }}>
                        <span>Owner</span><span>Plan</span><span>Amount</span><span>Date</span><span>Status</span>
                    </div>
                    {TRANSACTIONS.map((txn, idx) => (
                        <div key={idx} className="grid px-5 py-4 border-b last:border-0"
                            style={{ gridTemplateColumns: "1.5fr 80px 90px 100px 70px", background: idx % 2 === 0 ? "#0a0a0a" : "#090909", borderColor: T.border }}>
                            <div className="text-[14px] font-medium self-center" style={{ color: T.text }}>{txn.owner}</div>
                            <div className="text-[13px] self-center" style={{ color: T.muted }}>{txn.plan}</div>
                            <div className="text-[14px] font-semibold font-mono self-center tabular-nums" style={{ color: T.text }}>₹{txn.amount.toLocaleString("en-IN")}</div>
                            <div className="text-[13px] self-center" style={{ color: T.muted }}>{txn.date}</div>
                            <div className="self-center">
                                <span className="text-[11px] font-medium px-2 py-1 rounded-md"
                                    style={{ color: txn.status === "paid" ? T.ok : T.terra, background: txn.status === "paid" ? "rgba(74,170,120,0.09)" : T.terraBg }}>
                                    {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Plans */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border, background: T.surface }}>
                    <div className="px-6 py-5 border-b" style={{ borderColor: T.border }}>
                        <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1rem", color: T.text }}>Subscription plans</div>
                    </div>
                    {PLANS.map((plan, idx) => (
                        <div key={idx} className="px-6 py-5 border-b last:border-0"
                            style={{ borderColor: T.border, background: plan.highlight ? "rgba(200,160,52,0.04)" : undefined }}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span style={{ fontFamily: D, fontWeight: 700, fontSize: "1rem", color: plan.highlight ? T.gold : T.text }}>{plan.name}</span>
                                        {plan.highlight && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide" style={{ color: T.gold, background: T.goldBg }}>Popular</span>}
                                    </div>
                                    <div className="text-[12px] mt-1" style={{ color: T.muted }}>{plan.desc}</div>
                                </div>
                                <div className="text-right">
                                    <div style={{ fontFamily: D, fontWeight: 700, fontSize: "1.3rem", color: T.text }}>₹{plan.price.toLocaleString("en-IN")}</div>
                                    <div className="text-[11px]" style={{ color: T.muted }}>/mo</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3">
                                <div className="h-1 rounded-full flex-1" style={{ background: "rgba(232,228,221,0.07)" }}>
                                    <div className="h-full rounded-full" style={{ width: `${(plan.tenants / 13) * 100}%`, background: plan.highlight ? T.gold : "rgba(232,228,221,0.25)" }} />
                                </div>
                                <span className="text-[11px]" style={{ color: T.muted }}>{plan.tenants} tenants</span>
                            </div>
                        </div>
                    ))}
                    <div className="px-6 py-4 border-t" style={{ borderColor: T.border }}>
                        <p className="text-[12px]" style={{ color: T.muted }}>
                            Full Razorpay integration coming soon.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
