import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { useAdminData } from "@/hooks/useAdminData"
import type { Billing } from "@/types/database"

const D = "'Syne', sans-serif"
const I = "'Inter', sans-serif"
const T = {
    text: "#e8e4dd",
    muted: "rgba(232,228,221,0.38)",
    border: "rgba(232,228,221,0.07)",
    surface: "#0d0d0d",
    ok: "#4aaa78",
    terra: "#b85c35",
    terraBg: "rgba(184,92,53,0.08)",
    gold: "#c8a034",
}

type BillingRow = Billing & {
    ownerName: string
    businessName: string
}

type SignupRow = {
    id: string
    ownerName: string
    businessName: string
    plan: string
    createdAt: string
    isActive: boolean
}

const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
})

const compactCurrency = new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
})

function Spinner() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-5 h-5 rounded-full border border-t-[#c8a034] border-[rgba(232,228,221,0.08)] animate-spin" />
        </div>
    )
}

export default function AdminBilling() {
    const { owners, loading: ownersLoading } = useAdminData()
    const [billingRows, setBillingRows] = useState<BillingRow[]>([])
    const [billingLoading, setBillingLoading] = useState(true)

    useEffect(() => {
        const loadBilling = async () => {
            setBillingLoading(true)

            const { data } = await supabase
                .from("billing")
                .select("*")
                .order("created_at", { ascending: false })

            const businessesById = new Map(
                owners.flatMap(owner =>
                    owner.businesses.map(business => [
                        business.id,
                        {
                            ownerName: owner.full_name || owner.email || "Owner",
                            businessName: business.name || "Business",
                        },
                    ] as const)
                )
            )

            const mapped = ((data as Billing[]) ?? []).map((row) => {
                const related = businessesById.get(row.business_id)
                return {
                    ...row,
                    ownerName: related?.ownerName ?? "Owner",
                    businessName: related?.businessName ?? "Business",
                }
            })

            setBillingRows(mapped)
            setBillingLoading(false)
        }

        if (!ownersLoading) {
            loadBilling()
        }
    }, [owners, ownersLoading])

    const signupRows = useMemo<SignupRow[]>(() => {
        return owners.flatMap((owner) =>
            owner.businesses.map((business) => ({
                id: business.id,
                ownerName: owner.full_name || owner.email || "Owner",
                businessName: business.name || "Business",
                plan: business.plan || "trial",
                createdAt: business.created_at || owner.created_at,
                isActive: business.is_active,
            }))
        )
    }, [owners])

    const totalRevenue = billingRows
        .filter((row) => row.status === "paid")
        .reduce((sum, row) => sum + Number(row.amount_inr || 0), 0)

    const annualRevenue = totalRevenue * 12
    const activeTenants = signupRows.filter((row) => row.isActive).length
    const paidInvoices = billingRows.filter((row) => row.status === "paid").length
    const showBillingRows = billingRows.length > 0

    if (ownersLoading || billingLoading) return <Spinner />

    return (
        <div style={{ fontFamily: I }}>
            <div className="mb-8">
                <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Admin console</p>
                <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                    Billing & revenue
                </h1>
            </div>

            <div className="mb-8 flex divide-x overflow-hidden rounded-xl border"
                style={{ borderColor: "rgba(200,160,52,0.2)", background: "rgba(200,160,52,0.04)" }}>
                {[
                    { label: "Collected revenue", value: currency.format(totalRevenue) },
                    { label: "Annualized revenue", value: `${compactCurrency.format(annualRevenue)}` },
                    { label: "Registered tenants", value: signupRows.length },
                    { label: showBillingRows ? "Paid invoices" : "Active tenants", value: showBillingRows ? paidInvoices : activeTenants },
                ].map((metric, index) => (
                    <div key={index} className="flex-1 px-6 py-5">
                        <div style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.5rem,2.5vw,2.2rem)", color: T.text, letterSpacing: "-0.04em", lineHeight: 1 }}>
                            {metric.value}
                        </div>
                        <div className="mt-2 text-[11px] uppercase tracking-[0.15em]" style={{ color: T.muted }}>
                            {metric.label}
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
                <div className="px-6 py-5 border-b" style={{ background: T.surface, borderColor: T.border }}>
                    <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1rem", color: T.text }}>
                        {showBillingRows ? "Transactions" : "Registered businesses"}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>
                        {showBillingRows
                            ? "Live billing records from signed-up tenants"
                            : "Showing only businesses that have signed up on the platform"}
                    </div>
                </div>

                {showBillingRows ? (
                    <>
                        <div className="grid px-5 py-2.5 border-b text-[10px] uppercase tracking-[0.18em]"
                            style={{ gridTemplateColumns: "1.4fr 1.4fr 90px 110px 100px 80px", background: "#0a0a0a", borderColor: T.border, color: T.muted }}>
                            <span>Owner</span>
                            <span>Business</span>
                            <span>Plan</span>
                            <span>Amount</span>
                            <span>Date</span>
                            <span>Status</span>
                        </div>
                        {billingRows.map((row, idx) => (
                            <div key={row.id} className="grid px-5 py-4 border-b last:border-0"
                                style={{ gridTemplateColumns: "1.4fr 1.4fr 90px 110px 100px 80px", background: idx % 2 === 0 ? "#0a0a0a" : "#090909", borderColor: T.border }}>
                                <div className="text-[14px] font-medium self-center" style={{ color: T.text }}>{row.ownerName}</div>
                                <div className="text-[13px] self-center" style={{ color: T.text }}>{row.businessName}</div>
                                <div className="text-[13px] self-center capitalize" style={{ color: T.muted }}>{row.plan}</div>
                                <div className="text-[14px] font-semibold self-center tabular-nums" style={{ color: T.text }}>
                                    {currency.format(Number(row.amount_inr || 0))}
                                </div>
                                <div className="text-[13px] self-center" style={{ color: T.muted }}>
                                    {row.created_at ? format(new Date(row.created_at), "MMM d") : "-"}
                                </div>
                                <div className="self-center">
                                    <span className="text-[11px] font-medium px-2 py-1 rounded-md"
                                        style={{
                                            color: row.status === "paid" ? T.ok : T.terra,
                                            background: row.status === "paid" ? "rgba(74,170,120,0.09)" : T.terraBg,
                                        }}>
                                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </>
                ) : signupRows.length === 0 ? (
                    <div className="py-20 text-center" style={{ background: "#0a0a0a" }}>
                        <p className="text-[14px]" style={{ color: T.muted }}>No signed-up tenants found yet.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid px-5 py-2.5 border-b text-[10px] uppercase tracking-[0.18em]"
                            style={{ gridTemplateColumns: "1.4fr 1.4fr 100px 110px 90px", background: "#0a0a0a", borderColor: T.border, color: T.muted }}>
                            <span>Owner</span>
                            <span>Business</span>
                            <span>Plan</span>
                            <span>Joined</span>
                            <span>Status</span>
                        </div>
                        {signupRows.map((row, idx) => (
                            <div key={row.id} className="grid px-5 py-4 border-b last:border-0"
                                style={{ gridTemplateColumns: "1.4fr 1.4fr 100px 110px 90px", background: idx % 2 === 0 ? "#0a0a0a" : "#090909", borderColor: T.border }}>
                                <div className="text-[14px] font-medium self-center" style={{ color: T.text }}>{row.ownerName}</div>
                                <div className="text-[13px] self-center" style={{ color: T.text }}>{row.businessName}</div>
                                <div className="text-[13px] self-center capitalize" style={{ color: T.muted }}>{row.plan}</div>
                                <div className="text-[13px] self-center" style={{ color: T.muted }}>
                                    {row.createdAt ? format(new Date(row.createdAt), "MMM d, yyyy") : "-"}
                                </div>
                                <div className="self-center">
                                    <span className="text-[11px] font-medium px-2 py-1 rounded-md"
                                        style={{
                                            color: row.isActive ? T.ok : T.terra,
                                            background: row.isActive ? "rgba(74,170,120,0.09)" : T.terraBg,
                                        }}>
                                        {row.isActive ? "Active" : "Pending"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    )
}
