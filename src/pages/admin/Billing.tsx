import { CreditCard, IndianRupee, TrendingUp, Users, Zap, ArrowUpRight } from "lucide-react"

const C = {
  gold: "#c9a227", goldLight: "rgba(201,162,39,0.1)", goldBorder: "rgba(201,162,39,0.18)",
  terra: "#c4643a", terraLight: "rgba(196,100,58,0.1)", terraBorder: "rgba(196,100,58,0.18)",
  text: "#f0ede8", textMuted: "rgba(240,237,232,0.4)",
  surface: "#0f0f0f", elevated: "#141414", border: "rgba(255,255,255,0.06)",
  ok: "#5c9e6e", okBg: "rgba(92,158,110,0.1)",
}

const PLANS = [
  { name: "Starter", price: "₹999", per: "/ month", tenants: 3, desc: "Single agent, 500 calls/mo", color: C.textMuted },
  { name: "Growth", price: "₹2,499", per: "/ month", tenants: 8, desc: "3 agents, 2,000 calls/mo, analytics", color: C.gold },
  { name: "Enterprise", price: "₹7,999", per: "/ month", tenants: 2, desc: "Unlimited agents, custom prompts, SLA", color: C.terra },
]

const MOCK_TXN = [
  { id: "txn_001", owner: "Dr. Ananya Kapoor", plan: "Growth", amount: "₹2,499", date: "Mar 28, 2026", status: "Paid" },
  { id: "txn_002", owner: "Raj Sharma Auto Works", plan: "Starter", amount: "₹999", date: "Mar 27, 2026", status: "Paid" },
  { id: "txn_003", owner: "Luxe Beauty Salon", plan: "Enterprise", amount: "₹7,999", date: "Mar 25, 2026", status: "Paid" },
  { id: "txn_004", owner: "Gupta Real Estate", plan: "Growth", amount: "₹2,499", date: "Mar 22, 2026", status: "Due" },
]

export default function AdminBilling() {
  const mrr = PLANS.reduce((acc, p) => acc + parseInt(p.price.replace(/[₹,]/g, "")) * p.tenants, 0)

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="mb-10">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full mb-4"
          style={{ color: C.terra, background: C.terraLight, border: `1px solid ${C.terraBorder}` }}>
          <span className="w-1.5 h-1.5 bg-[#c4643a] rounded-full" />
          Sovereign Admin
        </span>
        <h1 className="text-[2.4rem] leading-tight mb-1" style={{ fontFamily: "'Instrument Serif', serif", color: C.text }}>
          Billing & Plans
        </h1>
        <p className="text-[14px]" style={{ color: C.textMuted }}>Platform revenue, subscriptions, and transaction history.</p>
      </div>

      {/* MRR strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border p-6 col-span-1" style={{ background: C.surface, borderColor: C.goldBorder }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: C.goldLight }}>
            <IndianRupee className="w-4 h-4" style={{ color: C.gold }} />
          </div>
          <div className="text-[2rem] font-bold tabular-nums" style={{ color: C.text }}>₹{mrr.toLocaleString("en-IN")}</div>
          <div className="text-[12px] mt-1" style={{ color: C.textMuted }}>Monthly Recurring Revenue</div>
        </div>
        <div className="rounded-2xl border p-6" style={{ background: C.surface, borderColor: C.border }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(92,158,110,0.1)" }}>
            <Users className="w-4 h-4" style={{ color: C.ok }} />
          </div>
          <div className="text-[2rem] font-bold" style={{ color: C.text }}>13</div>
          <div className="text-[12px] mt-1" style={{ color: C.textMuted }}>Paying Subscriptions</div>
        </div>
        <div className="rounded-2xl border p-6" style={{ background: C.surface, borderColor: C.border }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: C.terraLight }}>
            <TrendingUp className="w-4 h-4" style={{ color: C.terra }} />
          </div>
          <div className="text-[2rem] font-bold" style={{ color: C.text }}>+18%</div>
          <div className="text-[12px] mt-1" style={{ color: C.textMuted }}>MoM Growth</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plans */}
        <div className="rounded-2xl border p-6" style={{ background: C.surface, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4" style={{ color: C.gold }} />
            <h2 className="text-[15px] font-semibold" style={{ color: C.text }}>Subscription Plans</h2>
          </div>
          <div className="space-y-3">
            {PLANS.map(plan => (
              <div key={plan.name} className="flex items-center justify-between p-4 rounded-xl border"
                style={{ background: C.elevated, borderColor: C.border }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: plan.color }}>{plan.name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full tabular-nums"
                      style={{ background: "rgba(255,255,255,0.05)", color: C.textMuted }}>
                      {plan.tenants} tenants
                    </span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: C.textMuted }}>{plan.desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-bold tabular-nums" style={{ color: C.text }}>{plan.price}</div>
                  <div className="text-[11px]" style={{ color: C.textMuted }}>{plan.per}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <div className="rounded-2xl border p-6" style={{ background: C.surface, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-4 h-4" style={{ color: C.terra }} />
            <h2 className="text-[15px] font-semibold" style={{ color: C.text }}>Recent Transactions</h2>
          </div>
          <div className="space-y-3">
            {MOCK_TXN.map(txn => (
              <div key={txn.id} className="flex items-center justify-between py-3 border-b last:border-0"
                style={{ borderColor: C.border }}>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: C.text }}>{txn.owner}</div>
                  <div className="text-[11px]" style={{ color: C.textMuted }}>{txn.plan} · {txn.date}</div>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-semibold tabular-nums" style={{ color: C.text }}>{txn.amount}</div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{ color: txn.status === "Paid" ? C.ok : C.terra, background: txn.status === "Paid" ? C.okBg : C.terraLight }}>
                    {txn.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t" style={{ borderColor: C.border }}>
            <div className="rounded-xl border px-4 py-3 flex items-center justify-between"
              style={{ background: "rgba(201,162,39,0.05)", borderColor: C.goldBorder }}>
              <p className="text-[12px]" style={{ color: C.textMuted }}>
                Full billing integration with Razorpay coming soon.
              </p>
              <ArrowUpRight className="w-4 h-4 flex-shrink-0" style={{ color: C.gold }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
