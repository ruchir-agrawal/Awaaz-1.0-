import { useAdminData } from "@/hooks/useAdminData"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { ArrowRight } from "lucide-react"

const D = "'Syne', sans-serif"
const I = "'Inter', sans-serif"
const T = {
    text: "#e8e4dd", muted: "rgba(232,228,221,0.38)", ghost: "rgba(232,228,221,0.1)",
    border: "rgba(232,228,221,0.07)", gold: "#c8a034", goldBg: "rgba(200,160,52,0.07)",
    terra: "#b85c35", terraBg: "rgba(184,92,53,0.08)", surface: "#0d0d0d", ok: "#4aaa78",
}

const INDUSTRIES: Record<string, string> = {
    Healthcare: "rgba(74,170,120,0.12)", "Real Estate": "rgba(200,160,52,0.1)",
    Retail: "rgba(74,127,165,0.1)", Education: "rgba(139,111,208,0.1)", Other: "rgba(232,228,221,0.07)"
}

export default function AdminOwnersList() {
    const { owners, loading } = useAdminData()

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-5 h-5 rounded-full border border-t-[#b85c35] border-[rgba(232,228,221,0.08)] animate-spin" />
        </div>
    )

    return (
        <div style={{ fontFamily: I }}>
            <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Admin console</p>
                    <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                        All owners
                    </h1>
                    <p className="text-[14px] mt-1" style={{ color: T.muted }}>{owners.length} tenants registered on the platform</p>
                </div>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
                {/* Col headers */}
                <div className="grid px-5 py-3 border-b text-[10px] uppercase tracking-[0.18em] font-medium"
                    style={{ gridTemplateColumns: "1.4fr 1.2fr 1fr 100px 110px 48px", background: T.surface, borderColor: T.border, color: T.muted }}>
                    <span>Owner</span><span>Business</span><span>Address / City</span><span>Industry</span><span>Joined</span><span />
                </div>

                {owners.length === 0 ? (
                    <div className="py-20 text-center" style={{ background: "#0a0a0a" }}>
                        <p className="text-[14px]" style={{ color: T.muted }}>No owners registered yet.</p>
                    </div>
                ) : owners.map((owner, idx) => {
                    const biz = owner.businesses?.[0]
                    const indBg = INDUSTRIES[biz?.industry ?? ""] ?? INDUSTRIES.Other
                    return (
                        <div key={owner.id}
                            className="grid px-5 py-4 border-b last:border-0 transition-colors hover:bg-[rgba(232,228,221,0.015)]"
                            style={{ gridTemplateColumns: "1.4fr 1.2fr 1fr 100px 110px 48px", background: idx % 2 === 0 ? "#0a0a0a" : "#090909", borderColor: T.border }}>
                            {/* Owner */}
                            <div>
                                <div className="text-[14px] font-medium" style={{ color: T.text }}>{owner.full_name || "—"}</div>
                                <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{owner.email}</div>
                                {biz?.phone && (
                                    <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>{biz.phone}</div>
                                )}
                            </div>
                            {/* Business name */}
                            <div className="self-center min-w-0 pr-3">
                                <div className="text-[13px] truncate" style={{ color: biz?.name ? T.text : T.muted }}>
                                    {biz?.name ?? <span style={{ fontStyle: "italic" }}>Unconfigured</span>}
                                </div>
                                {biz?.slug && (
                                    <div className="text-[11px] mt-0.5 truncate" style={{ color: T.muted }}>/{biz.slug}</div>
                                )}
                            </div>
                            {/* Address / City */}
                            <div className="self-center min-w-0 pr-3">
                                {biz?.address ? (
                                    <div className="text-[12px] truncate" style={{ color: T.muted }}>{biz.address}</div>
                                ) : biz?.city ? (
                                    <div className="text-[12px]" style={{ color: T.muted }}>{biz.city}</div>
                                ) : (
                                    <div className="text-[12px]" style={{ color: "rgba(232,228,221,0.15)", fontStyle: "italic" }}>—</div>
                                )}
                            </div>
                            {/* Industry */}
                            <div className="self-center">
                                {biz?.industry && (
                                    <span className="text-[11px] px-2.5 py-1 rounded-md capitalize" style={{ color: T.gold, background: indBg }}>
                                        {biz.industry}
                                    </span>
                                )}
                            </div>
                            <div className="self-center text-[12px]" style={{ color: T.muted }}>
                                {owner.created_at ? format(new Date(owner.created_at), "MMM d, yyyy") : "—"}
                            </div>
                            <div className="self-center flex justify-center">
                                <Link to={`/admin/owners/${owner.id}`}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-[rgba(232,228,221,0.06)]"
                                    style={{ color: T.muted }}>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
