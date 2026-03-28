import { useState, useEffect } from "react"
import { useBusinessData } from "@/hooks/useBusinessData"
import { supabase } from "@/lib/supabase"
import { Save, Loader2, Bot, Building2, Bell } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const C = {
  gold: "#c9a227", goldLight: "rgba(201,162,39,0.1)", goldBorder: "rgba(201,162,39,0.18)",
  text: "#f0ede8", textMuted: "rgba(240,237,232,0.4)", textGhost: "rgba(240,237,232,0.1)",
  surface: "#0f0f0f", elevated: "#141414", border: "rgba(255,255,255,0.06)",
}

const tabs = [
  { id: "business", label: "Business Info", icon: Building2 },
  { id: "agent", label: "Agent Config", icon: Bot },
  { id: "notifications", label: "Notifications", icon: Bell },
]

const fieldClass = "w-full bg-transparent border rounded-xl px-4 py-3 text-[14px] outline-none transition-all focus:border-[rgba(201,162,39,0.4)] placeholder-[rgba(240,237,232,0.2)]"

export default function Settings() {
  const { business, loading: bizLoading } = useBusinessData()
  const [activeTab, setActiveTab] = useState("business")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "", slug: "", industry: "", city: "", phone: "", address: "",
    agent_name: "", agent_voice: "shubh", system_prompt: "",
    notif_whatsapp: false, notif_reminder: false, notif_phone: "",
  })

  useEffect(() => {
    if (business) {
      setForm(f => ({
        ...f,
        name: business.name || "",
        slug: business.slug || "",
        industry: business.industry || "",
        city: business.city || "",
        phone: business.phone || "",
        address: business.address || "",
        agent_name: business.agent_name || "",
        agent_voice: business.agent_voice || "shubh",
        system_prompt: business.system_prompt || "",
      }))
    }
  }, [business])

  const update = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business) return
    setSaving(true)
    const payload: any = activeTab === "business"
      ? { name: form.name, slug: form.slug, industry: form.industry, city: form.city, phone: form.phone, address: form.address }
      : activeTab === "agent"
      ? { agent_name: form.agent_name, agent_voice: form.agent_voice, system_prompt: form.system_prompt }
      : {}
    const { error } = await supabase.from("businesses").update(payload).eq("id", business.id)
    setSaving(false)
    error ? toast.error("Save failed: " + error.message) : toast.success("Settings saved!")
  }

  if (bizLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#c9a227] border-white/10 animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="mb-10">
        <p className="text-[11px] tracking-[0.25em] uppercase mb-2" style={{ color: C.textMuted }}>Owner Portal</p>
        <h1 className="text-[2.2rem] leading-tight" style={{ fontFamily: "'Instrument Serif', serif", color: C.text }}>Settings</h1>
        <p className="text-[14px] mt-1" style={{ color: C.textMuted }}>Configure your business profile and AI agent behaviour.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-8 border-b" style={{ borderColor: C.border }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn("flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-all -mb-px",
              activeTab === t.id ? "border-[#c9a227]" : "border-transparent")}
            style={{ color: activeTab === t.id ? C.gold : C.textMuted }}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {/* Business Info */}
        {activeTab === "business" && (
          <div className="space-y-5 max-w-2xl">
            {[
              { label: "Business Name", key: "name", placeholder: "Your business name" },
              { label: "URL Slug", key: "slug", placeholder: "my-clinic", hint: "Used in your public voice link. Letters, numbers, hyphens only." },
              { label: "Industry", key: "industry", placeholder: "e.g. Healthcare, Real Estate, Salon" },
              { label: "City", key: "city", placeholder: "Mumbai" },
              { label: "Phone Number", key: "phone", placeholder: "+91 98765 43210" },
              { label: "Address", key: "address", placeholder: "123, Main Street, Mumbai" },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textMuted }}>{field.label}</label>
                <input value={(form as any)[field.key]} onChange={e => update(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={fieldClass} style={{ borderColor: C.border, color: C.text }} />
                {field.hint && <p className="text-[11px] mt-1.5" style={{ color: C.textMuted }}>{field.hint}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Agent Config */}
        {activeTab === "agent" && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textMuted }}>Agent Name</label>
              <input value={form.agent_name} onChange={e => update("agent_name", e.target.value)}
                placeholder="What should the AI call itself?" className={fieldClass} style={{ borderColor: C.border, color: C.text }} />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textMuted }}>Voice</label>
              <select value={form.agent_voice} onChange={e => update("agent_voice", e.target.value)}
                className={fieldClass} style={{ borderColor: C.border, color: C.text }}>
                {["shubh", "nisha", "aryan", "priya", "raj", "aisha"].map(v => (
                  <option key={v} value={v} style={{ background: "#111" }}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textMuted }}>System Prompt</label>
              <p className="text-[11px] mb-2" style={{ color: C.textMuted }}>Define how your AI agent introduces itself, what it can help with, and what to avoid.</p>
              <textarea value={form.system_prompt} onChange={e => update("system_prompt", e.target.value)}
                rows={10} placeholder="You are the AI receptionist for {business name}. You speak in Hindi and English. Help customers book appointments…"
                className={fieldClass} style={{ borderColor: C.border, color: C.text, fontFamily: "monospace", resize: "vertical" }} />
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === "notifications" && (
          <div className="space-y-5 max-w-xl">
            <p className="text-[13px]" style={{ color: C.textMuted }}>WhatsApp notifications will be sent via your connected number.</p>
            {[
              { key: "notif_whatsapp", label: "WhatsApp on new booking", desc: "Get a message every time a new appointment is booked" },
              { key: "notif_reminder", label: "Reminder 1 hour before", desc: "Automatic reminder to customer before their appointment" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between rounded-2xl border p-5"
                style={{ background: C.surface, borderColor: C.border }}>
                <div>
                  <div className="text-[14px] font-medium mb-0.5" style={{ color: C.text }}>{item.label}</div>
                  <div className="text-[12px]" style={{ color: C.textMuted }}>{item.desc}</div>
                </div>
                <button type="button" onClick={() => update(item.key, !(form as any)[item.key])}
                  className="w-12 h-6 rounded-full transition-all relative flex-shrink-0"
                  style={{ background: (form as any)[item.key] ? C.goldLight : C.border, border: `1px solid ${(form as any)[item.key] ? C.goldBorder : C.border}` }}>
                  <span className="absolute top-0.5 transition-all rounded-full w-5 h-5"
                    style={{ background: (form as any)[item.key] ? C.gold : "rgba(240,237,232,0.2)", left: (form as any)[item.key] ? "calc(100% - 22px)" : "2px" }} />
                </button>
              </div>
            ))}
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: C.textMuted }}>Notification Phone</label>
              <input value={form.notif_phone} onChange={e => update("notif_phone", e.target.value)}
                placeholder="+91 98765 43210" className={fieldClass} style={{ borderColor: C.border, color: C.text }} />
            </div>
          </div>
        )}

        {activeTab !== "notifications" && (
          <div className="mt-8">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ background: C.goldLight, color: C.gold, border: `1px solid ${C.goldBorder}` }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
