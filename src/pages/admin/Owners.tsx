import { useAdminData } from "@/hooks/useAdminData"
import { Link } from "react-router-dom"
import { Users, ArrowRight } from "lucide-react"
import { format } from "date-fns"

const C = {
  gold: "#c9a227", goldLight: "rgba(201,162,39,0.1)", goldBorder: "rgba(201,162,39,0.18)",
  terra: "#c4643a", terraLight: "rgba(196,100,58,0.1)", terraBorder: "rgba(196,100,58,0.18)",
  text: "#f0ede8", textMuted: "rgba(240,237,232,0.4)", textGhost: "rgba(240,237,232,0.1)",
  surface: "#0f0f0f", elevated: "#141414", border: "rgba(255,255,255,0.06)",
}

export default function AdminOwnersList() {
  const { owners, loading } = useAdminData()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#c4643a] border-white/10 animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="mb-10">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full mb-4"
          style={{ color: C.terra, background: C.terraLight, border: `1px solid ${C.terraBorder}` }}>
          <span className="w-1.5 h-1.5 bg-[#c4643a] rounded-full" />
          Sovereign Admin
        </span>
        <h1 className="text-[2.4rem] leading-tight mb-1" style={{ fontFamily: "'Instrument Serif', serif", color: C.text }}>
          All Owners
        </h1>
        <p className="text-[14px]" style={{ color: C.textMuted }}>
          {owners.length} tenants active on the platform.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.border }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ background: C.elevated, borderColor: C.border }}>
          <Users className="w-4 h-4" style={{ color: C.textMuted }} />
          <span className="text-[13px] font-semibold" style={{ color: C.text }}>Platform Owners</span>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[1.5fr_1fr_120px_100px_64px] px-5 py-3 border-b text-[11px] font-medium uppercase tracking-[0.15em]"
          style={{ background: "rgba(255,255,255,0.01)", borderColor: C.border, color: C.textMuted }}>
          <span>Owner</span><span>Business</span><span>Industry</span><span>Joined</span><span />
        </div>

        {owners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20" style={{ background: C.surface }}>
            <Users className="w-8 h-8 mb-4 opacity-20" style={{ color: C.text }} />
            <p className="text-[14px]" style={{ color: C.textMuted }}>No owners registered yet.</p>
          </div>
        ) : (
          owners.map((owner, idx) => {
            const biz = owner.businesses?.[0]
            return (
              <div key={owner.id}
                className="grid grid-cols-[1.5fr_1fr_120px_100px_64px] px-5 py-4 border-b transition-all hover:bg-white/[0.02]"
                style={{ background: idx % 2 === 0 ? C.surface : "rgba(255,255,255,0.01)", borderColor: C.border }}>
                <div>
                  <div className="text-[13px] font-medium" style={{ color: C.text }}>{owner.full_name || "—"}</div>
                  <div className="text-[11px]" style={{ color: C.textMuted }}>{owner.email}</div>
                </div>
                <div className="text-[13px] self-center" style={{ color: biz?.name ? C.text : C.textMuted }}>
                  {biz?.name ?? <span style={{ fontStyle: "italic" }}>Unconfigured</span>}
                </div>
                <div className="self-center">
                  {biz?.industry && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full capitalize"
                      style={{ color: C.gold, background: C.goldLight }}>
                      {biz.industry}
                    </span>
                  )}
                </div>
                <div className="text-[12px] self-center" style={{ color: C.textMuted }}>
                  {owner.created_at ? format(new Date(owner.created_at), "MMM dd, yyyy") : "—"}
                </div>
                <div className="flex items-center justify-center">
                  <Link to={`/admin/owners/${owner.id}`}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
                    style={{ color: C.textMuted }}>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
