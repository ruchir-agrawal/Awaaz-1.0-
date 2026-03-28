import { useParams, useNavigate } from "react-router-dom"
import { useAdminData } from "@/hooks/useAdminData"
import { ArrowLeft, User, Building2, Terminal } from "lucide-react"

const C = {
  gold: "#c9a227", goldLight: "rgba(201,162,39,0.1)", goldBorder: "rgba(201,162,39,0.18)",
  terra: "#c4643a", terraLight: "rgba(196,100,58,0.1)", terraBorder: "rgba(196,100,58,0.18)",
  text: "#f0ede8", textMuted: "rgba(240,237,232,0.4)", textGhost: "rgba(240,237,232,0.08)",
  surface: "#0f0f0f", elevated: "#141414", border: "rgba(255,255,255,0.06)",
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.2em] uppercase mb-1.5" style={{ color: C.textMuted }}>{label}</div>
      <div className={`text-[13px] ${mono ? "font-mono" : "font-medium"}`} style={{ color: C.text }}>{value}</div>
    </div>
  )
}

export default function AdminOwnerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { owners, loading } = useAdminData()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#c4643a] border-white/10 animate-spin" />
      </div>
    )
  }

  const owner = owners.find(o => o.id === id)

  if (!owner) {
    return (
      <div className="text-center py-24" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        <p className="text-[1.5rem] mb-3" style={{ fontFamily: "'Instrument Serif', serif", color: C.textMuted }}>
          Owner not found.
        </p>
        <button onClick={() => navigate("/admin/owners")}
          className="text-[13px] text-[rgba(240,237,232,0.4)] hover:text-[#f0ede8] transition-colors">
          ← Back to owners
        </button>
      </div>
    )
  }

  const biz = owner.businesses?.[0]

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Back + Header */}
      <div className="flex items-start gap-4 mb-10">
        <button onClick={() => navigate("/admin/owners")}
          className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:border-[rgba(196,100,58,0.3)] flex-shrink-0 mt-1"
          style={{ borderColor: C.border, color: C.textMuted }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full mb-3"
            style={{ color: C.terra, background: C.terraLight, border: `1px solid ${C.terraBorder}` }}>
            Sovereign Admin
          </span>
          <h1 className="text-[2.2rem] leading-tight mb-1" style={{ fontFamily: "'Instrument Serif', serif", color: C.text }}>
            Tenant Detail
          </h1>
          <p className="text-[14px]" style={{ color: C.textMuted }}>{owner.email}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
        {/* User Profile */}
        <div className="rounded-2xl border p-6" style={{ background: C.surface, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-6">
            <User className="w-4 h-4" style={{ color: C.gold }} />
            <h2 className="text-[14px] font-semibold" style={{ color: C.text }}>User Profile</h2>
          </div>
          <div className="space-y-5">
            <Field label="User ID" value={owner.id} mono />
            <Field label="Email" value={owner.email ?? "—"} />
            <Field label="Full Name" value={owner.full_name ?? "—"} />
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase mb-1.5" style={{ color: C.textMuted }}>Role</div>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ color: C.gold, background: C.goldLight }}>
                owner
              </span>
            </div>
          </div>
        </div>

        {/* Business */}
        <div className="rounded-2xl border p-6" style={{ background: C.surface, borderColor: C.border }}>
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-4 h-4" style={{ color: C.terra }} />
            <h2 className="text-[14px] font-semibold" style={{ color: C.text }}>Primary Business</h2>
          </div>
          {biz ? (
            <div className="space-y-5">
              <Field label="Business Name" value={biz.name} />
              <div>
                <div className="text-[10px] tracking-[0.2em] uppercase mb-1.5" style={{ color: C.textMuted }}>Industry</div>
                <span className="text-[11px] px-2.5 py-1 rounded-full capitalize" style={{ color: C.gold, background: C.goldLight }}>
                  {biz.industry || "—"}
                </span>
              </div>
              <Field label="Agent Name" value={biz.agent_name} />
              <Field label="Public Slug" value={biz.slug} mono />
              <div>
                <div className="text-[10px] tracking-[0.2em] uppercase mb-1.5" style={{ color: C.textMuted }}>Status</div>
                <span className="text-[11px] px-2.5 py-1 rounded-full" style={biz.is_active !== false
                  ? { color: "#5c9e6e", background: "rgba(92,158,110,0.1)" }
                  : { color: C.terra, background: C.terraLight }}>
                  {biz.is_active !== false ? "Active" : "Suspended"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32" style={{ color: C.textMuted }}>
              <p className="text-[13px] italic">No business configuration found.</p>
            </div>
          )}
        </div>

        {/* System Prompt */}
        {biz?.system_prompt && (
          <div className="md:col-span-2 rounded-2xl border p-6" style={{ background: C.surface, borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-4 h-4" style={{ color: C.gold }} />
              <h2 className="text-[14px] font-semibold" style={{ color: C.text }}>System Prompt</h2>
              <span className="text-[10px] ml-auto px-2 py-0.5 rounded-full font-medium" style={{ color: C.textMuted, background: C.textGhost }}>
                Read-only
              </span>
            </div>
            <pre className="text-[12px] font-mono leading-relaxed whitespace-pre-wrap rounded-xl p-5 border overflow-x-auto"
              style={{ background: "#080808", borderColor: C.border, color: "rgba(201,162,39,0.7)" }}>
              {biz.system_prompt}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
