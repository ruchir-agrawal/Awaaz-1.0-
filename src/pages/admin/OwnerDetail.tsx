import { useParams, useNavigate } from "react-router-dom"
import { useAdminData } from "@/hooks/useAdminData"
import { ArrowLeft, Save, Loader2, Sparkles, Bot, Wand2, PlusCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

const D = "'Syne', sans-serif"
const I = "'Inter', sans-serif"
const T = {
    text: "#e8e4dd", muted: "rgba(232,228,221,0.38)", ghost: "rgba(232,228,221,0.1)",
    border: "rgba(232,228,221,0.07)", gold: "#c8a034", goldBg: "rgba(200,160,52,0.07)",
    terra: "#b85c35", terraBg: "rgba(184,92,53,0.08)", surface: "#0d0d0d", ok: "#4aaa78",
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex items-start justify-between py-4 border-b last:border-0" style={{ borderColor: T.border }}>
            <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: T.muted }}>{label}</span>
            <span className={`text-[14px] font-medium text-right max-w-[60%] ${mono ? "font-mono text-[12px]" : ""}`}
                style={{ color: T.text }}>
                {value}
            </span>
        </div>
    )
}

export default function AdminOwnerDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { owners, loading, refresh } = useAdminData()
    const [saving, setSaving] = useState(false)
    const [creating, setCreating] = useState(false)

    // Form state for editing
    const [form, setForm] = useState({
        agent_name: "",
        agent_voice: "shubh",
        system_prompt: "",
        is_active: true
    })

    const owner = owners.find(o => o.id === id)
    const biz = owner?.businesses?.[0]

    // Sync form when biz loads
    useEffect(() => {
        if (biz) {
            setForm({
                agent_name: biz.agent_name || "Shubh",
                agent_voice: biz.agent_voice || "shubh",
                system_prompt: biz.system_prompt || "",
                is_active: biz.is_active ?? true
            })
        }
    }, [biz])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-5 h-5 rounded-full border border-t-[#b85c35] border-[rgba(232,228,221,0.08)] animate-spin" />
        </div>
    )

    if (!owner) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <p style={{ fontFamily: D, fontSize: "1.5rem", color: T.muted }}>Owner not found</p>
            <button onClick={() => navigate("/admin/owners")}
                className="text-[13px] transition-colors hover:opacity-70" style={{ color: T.muted, fontFamily: I }}>
                ← Back to owners
            </button>
        </div>
    )

    const handleCreateBiz = async () => {
        if (!owner) return
        setCreating(true)
        try {
            const slug = (owner.full_name || "business").toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000)
            const { error } = await supabase.from('businesses').insert({
                owner_id: owner.id,
                name: owner.full_name || "New Business",
                slug: slug,
                agent_name: "Shubh"
            })
            if (error) throw error
            toast.success("Business profile created! You can now configure the AI.")
            if (refresh) await refresh()
        } catch (err: any) {
            toast.error(err.message || "Failed to create business profile")
        } finally {
            setCreating(false)
        }
    }

    const handleSave = async () => {
        if (!biz) return
        setSaving(true)
        try {
            const { error } = await supabase
                .from('businesses')
                .update({
                    agent_name: form.agent_name,
                    agent_voice: form.agent_voice,
                    system_prompt: form.system_prompt,
                    is_active: form.is_active
                })
                .eq('id', biz.id)

            if (error) throw error
            toast.success("Agent configuration saved successfully")
            if (refresh) await refresh()
        } catch (err: any) {
            toast.error(err.message || "Failed to save configuration")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{ fontFamily: I }}>
            {/* Back + Header */}
            <div className="flex items-start gap-4 mb-8">
                <button onClick={() => navigate("/admin/owners")}
                    className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all hover:bg-[rgba(232,228,221,0.04)] mt-1 shrink-0"
                    style={{ borderColor: T.border, color: T.muted }}>
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Admin console</p>
                    <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                        {owner.full_name ?? owner.email ?? "Unknown owner"}
                    </h1>
                    <p className="text-[14px] mt-1" style={{ color: T.muted }}>{owner.email}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
                {/* User */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border, background: T.surface }}>
                    <div className="px-6 py-5 border-b" style={{ borderColor: T.border }}>
                        <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1rem", color: T.text }}>Account</div>
                    </div>
                    <div className="px-6">
                        <Row label="User ID" value={owner.id} mono />
                        <Row label="Email" value={owner.email ?? "—"} />
                        <Row label="Full name" value={owner.full_name ?? "—"} />
                        <Row label="Role" value="owner" />
                        <Row label="Joined" value={owner.created_at ? new Date(owner.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
                    </div>
                </div>

                {/* Business */}
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border, background: T.surface }}>
                    <div className="px-6 py-5 border-b" style={{ borderColor: T.border }}>
                        <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1rem", color: T.text }}>Business</div>
                    </div>
                    {biz ? (
                        <div className="px-6">
                            <Row label="Name" value={biz.name} />
                            <Row label="Industry" value={biz.industry ?? "—"} />
                            <Row label="City" value={biz.city ?? "—"} />
                            <Row label="Slug" value={biz.slug} mono />
                            <Row label="Agent" value={biz.agent_name} />
                            <div className="py-4">
                                <span className="text-[10px] uppercase tracking-[0.18em] block mb-2" style={{ color: T.muted }}>Status</span>
                                <span className="text-[12px] font-medium px-2.5 py-1 rounded-md" style={{
                                    color: biz.is_active ? T.ok : T.terra,
                                    background: biz.is_active ? "rgba(74,170,120,0.09)" : T.terraBg
                                }}>
                                    {biz.is_active ? "Active" : "Suspended"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="px-6 py-10 text-center">
                            <PlusCircle className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: T.text }} />
                            <p className="text-[13px] mb-6" style={{ color: T.muted }}>No business profile found for this owner.</p>
                            <button 
                                onClick={handleCreateBiz}
                                disabled={creating}
                                className="w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                                style={{ background: T.goldBg, color: T.gold, border: `1px solid rgba(200,160,52,0.2)` }}>
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                                Create Business Profile
                            </button>
                        </div>
                    )}
                </div>

                {/* Agent Configuration Editor */}
                {biz ? (
                    <div className="md:col-span-2 rounded-xl border overflow-hidden" style={{ borderColor: T.border, background: T.surface }}>
                        <div className="px-6 py-5 border-b flex items-center justify-between bg-[rgba(232,228,221,0.02)]" style={{ borderColor: T.border }}>
                            <div className="flex items-center gap-2.5">
                                <Bot className="w-4 h-4" style={{ color: T.gold }} />
                                <div style={{ fontFamily: D, fontWeight: 600, fontSize: "1.1rem", color: T.text }}>Agent Configuration</div>
                            </div>
                            <button 
                                disabled={saving}
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                                style={{ background: T.terra, color: T.text, fontFamily: I }}>
                                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                {saving ? "Saving..." : "Save Configuration"}
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Agent Identity Name</label>
                                    <input 
                                        value={form.agent_name}
                                        onChange={e => setForm({...form, agent_name: e.target.value})}
                                        placeholder="e.g. Shubh" 
                                        className="w-full bg-transparent border rounded-lg px-4 py-2.5 text-[14px] outline-none transition-all focus:border-[rgba(184,92,53,0.3)]"
                                        style={{ borderColor: T.border, color: T.text }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Voice Selection (Sarvam)</label>
                                    <select 
                                        value={form.agent_voice}
                                        onChange={e => setForm({...form, agent_voice: e.target.value})}
                                        className="w-full bg-[#111] border rounded-lg px-4 py-2.5 text-[14px] outline-none transition-all focus:border-[rgba(184,92,53,0.3)]"
                                        style={{ borderColor: T.border, color: T.text }}>
                                        {["shubh", "nisha", "aryan", "priya", "raj", "aisha"].map(v => (
                                            <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Agent Status</label>
                                    <div className="flex items-center gap-3 h-[45px]">
                                        <button 
                                            onClick={() => setForm({...form, is_active: !form.is_active})}
                                            className="w-11 h-6 rounded-full relative transition-all"
                                            style={{ 
                                                background: form.is_active ? T.ok : "rgba(232,228,221,0.05)",
                                                border: `1px solid ${form.is_active ? "transparent" : T.border}`
                                            }}>
                                            <span className="absolute top-0.5 rounded-full w-5 h-5 transition-all bg-white shadow-sm"
                                                style={{ left: form.is_active ? "calc(100% - 22px)" : "2px" }} />
                                        </button>
                                        <span className="text-[13px] font-medium" style={{ color: form.is_active ? T.ok : T.terra }}>
                                            {form.is_active ? "Online & Active" : "Suspended / Offline"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]" style={{ color: T.muted }}>
                                        <Wand2 className="w-3 h-3" />
                                        Master System Prompt (Claude Output)
                                    </label>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(184,92,53,0.08)]" style={{ color: T.terra }}>
                                        Supports Multi-page text
                                    </span>
                                </div>
                                <div className="relative group">
                                    <div className="absolute -inset-[1px] bg-gradient-to-b from-[rgba(184,92,53,0.2)] to-transparent rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                                    <textarea 
                                        value={form.system_prompt}
                                        onChange={e => setForm({...form, system_prompt: e.target.value})}
                                        placeholder="Paste the long system prompt here..."
                                        className="w-full bg-[#060606] border rounded-xl p-5 text-[13px] font-mono leading-relaxed outline-none transition-all min-h-[400px] resize-y scrollbar-thin"
                                        style={{ borderColor: T.border, color: "rgba(232,228,221,0.85)" }}
                                    />
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-[11px]" style={{ color: T.muted }}>
                                    <Sparkles className="w-3 h-3 text-amber-500/50" />
                                    <span>Tip: Use </span>
                                    <code className="text-amber-500/70 bg-white/5 px-1.5 py-0.5 rounded">{"{{SESSION_UID}}"}</code>
                                    <span> anywhere to inject the dynamic call ID.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
