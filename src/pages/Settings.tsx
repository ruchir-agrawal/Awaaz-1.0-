import { useEffect, useRef, useState } from "react"
import { useBusinessData } from "@/hooks/useBusinessData"
import { supabase } from "@/lib/supabase"
import {
    DEFAULT_BUSINESS_SHEET_TAB,
    isBusinessSheetSchemaMissing,
    parseSpreadsheetId,
    provisionBusinessSheet,
} from "@/lib/googleSheet"
import {
    Building2,
    Bell,
    CalendarDays,
    CircleCheckBig,
    Database,
    ExternalLink,
    Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { SaveToggle, type SaveToggleStatus } from "@/components/ui/save-toggle"

const D = "'Syne', sans-serif"
const I = "'Inter', sans-serif"
const T = {
    text: "#e8e4dd", muted: "rgba(232,228,221,0.38)", ghost: "rgba(232,228,221,0.1)",
    border: "rgba(232,228,221,0.07)", borderStrong: "rgba(232,228,221,0.12)",
    gold: "#c8a034", goldBg: "rgba(200,160,52,0.07)", surface: "#0d0d0d",
}

const tabs = [
    { id: "business", label: "Business", icon: Building2 },
    { id: "connect", label: "Connect", icon: CalendarDays },
    { id: "notifications", label: "Notifications", icon: Bell },
]

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
    <div>
        <label className="block text-[10px] uppercase tracking-[0.18em] mb-2" style={{ color: T.muted }}>{label}</label>
        {children}
        {hint && <p className="text-[11px] mt-1.5" style={{ color: "rgba(232,228,221,0.25)" }}>{hint}</p>}
    </div>
)

const inputCls = "w-full bg-transparent border rounded-lg px-4 py-3 text-[14px] outline-none transition-all focus:border-[rgba(200,160,52,0.35)] placeholder-[rgba(232,228,221,0.2)]"

export default function Settings() {
    const { business, loading: bizLoading, refetch } = useBusinessData()
    const [tab, setTab] = useState("business")
    const [saveStatus, setSaveStatus] = useState<SaveToggleStatus>("idle")
    const [sheetInput, setSheetInput] = useState("")
    const [sheetAction, setSheetAction] = useState<"idle" | "creating" | "connecting" | "disconnecting">("idle")
    const [form, setForm] = useState({
        name: "", slug: "", industry: "", city: "", phone: "", address: "",
        notif_whatsapp: false, notif_reminder: false, notif_phone: "",
    })
    const savedStateTimer = useRef<number | null>(null)
    const bridgeUrl = import.meta.env.VITE_GOOGLE_BRIDGE_URL

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
            }))
            setSheetInput(business.google_sheet_url || business.google_sheet_id || "")
        }
    }, [business])

    useEffect(() => {
        return () => {
            if (savedStateTimer.current) {
                window.clearTimeout(savedStateTimer.current)
            }
        }
    }, [])

    const resetSaveState = () => {
        if (savedStateTimer.current) {
            window.clearTimeout(savedStateTimer.current)
            savedStateTimer.current = null
        }
        setSaveStatus("idle")
    }

    const up = (k: string, v: any) => {
        setForm(f => ({ ...f, [k]: v }))
        if (saveStatus === "saved") {
            resetSaveState()
        }
    }

    const save = async () => {
        if (!business || saveStatus === "loading") return
        if (savedStateTimer.current) {
            window.clearTimeout(savedStateTimer.current)
            savedStateTimer.current = null
        }
        setSaveStatus("loading")
        const payload = tab === "business"
            ? { name: form.name, slug: form.slug, industry: form.industry, city: form.city, phone: form.phone, address: form.address }
            : {}
        const { error } = await supabase.from("businesses").update(payload).eq("id", business.id)
        if (error) {
            setSaveStatus("idle")
            toast.error(error.message)
            return
        }

        toast.success("Saved")
        setSaveStatus("success")
        savedStateTimer.current = window.setTimeout(() => {
            setSaveStatus("saved")
            savedStateTimer.current = null
        }, 800)
    }

    const persistBusinessSheet = async (payload: {
        google_sheet_id: string | null
        google_sheet_url: string | null
        google_sheet_tab_name: string
    }) => {
        if (!business) return false

        const { error } = await supabase
            .from("businesses")
            .update(payload)
            .eq("id", business.id)

        if (error) {
            if (isBusinessSheetSchemaMissing(error.message)) {
                toast.error("Database migration pending. Run the business sheet SQL migration in Supabase first.")
            } else {
                toast.error(error.message)
            }
            return false
        }

        await refetch()
        return true
    }

    const handleCreateDedicatedSheet = async () => {
        if (!business) return
        if (!bridgeUrl) {
            toast.error("Google Bridge URL is not configured.")
            return
        }

        setSheetAction("creating")
        try {
            const result = await provisionBusinessSheet(bridgeUrl, {
                businessName: business.name,
                sheetName: business.google_sheet_tab_name || DEFAULT_BUSINESS_SHEET_TAB,
                createDedicatedSpreadsheet: true,
            })

            if (result.status !== "success" && result.status !== "ok") {
                throw new Error(result.message || "Sheet creation failed.")
            }

            const didPersist = await persistBusinessSheet({
                google_sheet_id: result.spreadsheetId || null,
                google_sheet_url: result.spreadsheetUrl || null,
                google_sheet_tab_name: result.sheetName || DEFAULT_BUSINESS_SHEET_TAB,
            })

            if (didPersist) {
                setSheetInput(result.spreadsheetUrl || result.spreadsheetId || "")
                toast.success("Dedicated business sheet connected.")
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not create business sheet."
            toast.error(message)
        } finally {
            setSheetAction("idle")
        }
    }

    const handleConnectExistingSheet = async () => {
        if (!business) return
        if (!bridgeUrl) {
            toast.error("Google Bridge URL is not configured.")
            return
        }

        const spreadsheetId = parseSpreadsheetId(sheetInput)
        if (!spreadsheetId) {
            toast.error("Paste a valid Google Sheet URL or spreadsheet ID.")
            return
        }

        setSheetAction("connecting")
        try {
            const result = await provisionBusinessSheet(bridgeUrl, {
                businessName: business.name,
                spreadsheetId,
                sheetName: business.google_sheet_tab_name || DEFAULT_BUSINESS_SHEET_TAB,
                createDedicatedSpreadsheet: false,
            })

            if (result.status !== "success" && result.status !== "ok") {
                throw new Error(result.message || "Could not connect that sheet.")
            }

            const didPersist = await persistBusinessSheet({
                google_sheet_id: result.spreadsheetId || spreadsheetId,
                google_sheet_url: result.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
                google_sheet_tab_name: result.sheetName || DEFAULT_BUSINESS_SHEET_TAB,
            })

            if (didPersist) {
                setSheetInput(result.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`)
                toast.success("Existing Google Sheet connected.")
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Could not connect that sheet."
            toast.error(message)
        } finally {
            setSheetAction("idle")
        }
    }

    const handleUseSharedFallback = async () => {
        if (!business) return
        setSheetAction("disconnecting")
        try {
            const didPersist = await persistBusinessSheet({
                google_sheet_id: null,
                google_sheet_url: null,
                google_sheet_tab_name: DEFAULT_BUSINESS_SHEET_TAB,
            })

            if (didPersist) {
                setSheetInput("")
                toast.success("This business is back on the shared-sheet fallback.")
            }
        } finally {
            setSheetAction("idle")
        }
    }

    if (bizLoading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-5 h-5 rounded-full border border-t-[#c8a034] border-[rgba(232,228,221,0.08)] animate-spin" />
        </div>
    )

    const hasDedicatedSheet = Boolean(business?.google_sheet_id)
    const sheetButtonBusy = sheetAction !== "idle"

    return (
        <div style={{ fontFamily: I }}>
            <div className="mb-8">
                <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Owner portal</p>
                <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                    Settings
                </h1>
            </div>

            <div className="flex gap-0 border-b mb-8" style={{ borderColor: T.border }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={cn("flex items-center gap-2 px-5 py-3 text-[13px] font-medium border-b-2 -mb-px transition-all")}
                        style={{ borderColor: tab === t.id ? T.gold : "transparent", color: tab === t.id ? T.text : T.muted, fontFamily: I }}>
                        <t.icon className="w-3.5 h-3.5 opacity-70" />
                        {t.label}
                    </button>
                ))}
            </div>

            <form onSubmit={(e) => {
                e.preventDefault()
                void save()
            }}>
                {tab === "business" && (
                    <div className="space-y-6 max-w-xl">
                        <Field label="Business name">
                            <input value={form.name} onChange={e => up("name", e.target.value)}
                                placeholder="Your business name" className={inputCls}
                                style={{ borderColor: T.border, color: T.text }} />
                        </Field>
                        <Field label="URL slug" hint="Set by Admin. This unique identifier cannot be changed.">
                            <input value={form.slug} disabled={true}
                                placeholder="my-clinic" className={cn(inputCls, "opacity-60 cursor-not-allowed")}
                                style={{ borderColor: T.border, color: T.text }} />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Industry">
                                <input value={form.industry} onChange={e => up("industry", e.target.value)}
                                    placeholder="Healthcare" className={inputCls}
                                    style={{ borderColor: T.border, color: T.text }} />
                            </Field>
                            <Field label="City">
                                <input value={form.city} onChange={e => up("city", e.target.value)}
                                    placeholder="Mumbai" className={inputCls}
                                    style={{ borderColor: T.border, color: T.text }} />
                            </Field>
                        </div>
                        <Field label="Phone number">
                            <input value={form.phone} onChange={e => up("phone", e.target.value)}
                                placeholder="+91 98765 43210" className={inputCls}
                                style={{ borderColor: T.border, color: T.text }} />
                        </Field>
                        <Field label="Address">
                            <input value={form.address} onChange={e => up("address", e.target.value)}
                                placeholder="123 Main Street, Mumbai" className={inputCls}
                                style={{ borderColor: T.border, color: T.text }} />
                        </Field>
                    </div>
                )}

                {tab === "notifications" && (
                    <div className="space-y-4 max-w-xl">
                        <p className="text-[14px] mb-6" style={{ color: T.muted }}>
                            Receive WhatsApp notifications when your AI agent books appointments.
                        </p>
                        {[
                            { key: "notif_whatsapp", label: "Notify on new booking", desc: "WhatsApp message every time an appointment is booked" },
                            { key: "notif_reminder", label: "1-hour reminder", desc: "Automatic reminder sent to customer before their slot" },
                        ].map(item => (
                            <div key={item.key} className="flex items-center justify-between px-5 py-4 rounded-xl border"
                                style={{ background: T.surface, borderColor: T.border }}>
                                <div>
                                    <div className="text-[14px] font-medium mb-0.5" style={{ color: T.text }}>{item.label}</div>
                                    <div className="text-[12px]" style={{ color: T.muted }}>{item.desc}</div>
                                </div>
                                <button type="button" onClick={() => up(item.key, !(form as any)[item.key])}
                                    className="w-11 h-6 rounded-full relative transition-all shrink-0"
                                    style={{ background: (form as any)[item.key] ? T.goldBg : "rgba(232,228,221,0.07)", border: `1px solid ${(form as any)[item.key] ? "rgba(200,160,52,0.3)" : T.border}` }}>
                                    <span className="absolute top-0.5 rounded-full w-5 h-5 transition-all"
                                        style={{ background: (form as any)[item.key] ? T.gold : "rgba(232,228,221,0.2)", left: (form as any)[item.key] ? "calc(100% - 22px)" : "2px" }} />
                                </button>
                            </div>
                        ))}
                        <Field label="WhatsApp number for notifications">
                            <input value={form.notif_phone} onChange={e => up("notif_phone", e.target.value)}
                                placeholder="+91 98765 43210" className={inputCls}
                                style={{ borderColor: T.border, color: T.text }} />
                        </Field>
                    </div>
                )}

                {tab === "connect" && (
                    <div className="max-w-3xl space-y-6">
                        <div className="rounded-2xl border p-6 space-y-5" style={{ background: T.surface, borderColor: T.border }}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: T.muted }}>Cal.com</p>
                                    <h2 className="text-[1.4rem]" style={{ fontFamily: D, color: T.text }}>
                                        Shared calendar
                                    </h2>
                                    <p className="text-[13px] mt-2 leading-relaxed" style={{ color: T.muted }}>
                                        Awaaz is currently using one shared Cal.com admin account for scheduling. Every appointment is booked into the central calendar configured on the server.
                                    </p>
                                </div>
                                <div
                                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px]"
                                    style={{
                                        color: T.gold,
                                        background: T.goldBg,
                                        border: "1px solid rgba(200,160,52,0.18)"
                                    }}
                                >
                                    <CircleCheckBig className="w-3.5 h-3.5" />
                                    Unified
                                </div>
                            </div>

                            <div className="rounded-xl border px-4 py-4 text-[13px] leading-relaxed" style={{ borderColor: T.border, color: T.muted }}>
                                This temporary setup uses the admin Cal.com API key and a single shared event type. Business owners can already isolate their call records in a dedicated Google Sheet, and that data layer will keep working when per-owner calendars are enabled later.
                            </div>

                            <div className="text-[12px] space-y-1.5" style={{ color: T.muted }}>
                                <p>Future-ready flow: Awaaz sign-up → optional personal calendar connect → save `cal_user_id` → business-specific scheduling.</p>
                                <p>Current rollout keeps sheet storage independent from calendar ownership, so moving away from the unified Cal.com account will not affect your call logs.</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border p-6 space-y-5" style={{ background: T.surface, borderColor: T.border }}>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: T.muted }}>Data Sync</p>
                                    <h2 className="text-[1.4rem]" style={{ fontFamily: D, color: T.text }}>
                                        Business sheet
                                    </h2>
                                    <p className="text-[13px] mt-2 leading-relaxed" style={{ color: T.muted }}>
                                        Calls, transcripts, recording links, and appointment outcomes can be written to a dedicated Google Sheet for this business only.
                                    </p>
                                </div>
                                <div
                                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px]"
                                    style={{
                                        color: hasDedicatedSheet ? T.gold : T.muted,
                                        background: hasDedicatedSheet ? T.goldBg : "rgba(232,228,221,0.04)",
                                        border: `1px solid ${hasDedicatedSheet ? "rgba(200,160,52,0.18)" : T.border}`
                                    }}
                                >
                                    <Database className="w-3.5 h-3.5" />
                                    {hasDedicatedSheet ? "Dedicated sheet connected" : "Shared fallback active"}
                                </div>
                            </div>

                            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5">
                                <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: T.border }}>
                                    <div>
                                        <div className="text-[13px] font-medium mb-1" style={{ color: T.text }}>Automatic private sheet</div>
                                        <p className="text-[12px] leading-relaxed" style={{ color: T.muted }}>
                                            Create a fresh spreadsheet for this business. Awaaz will keep using the same `Records` tab, so your current API and voice-agent flow stay intact.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleCreateDedicatedSheet}
                                        disabled={sheetButtonBusy || !business || !bridgeUrl}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all hover:opacity-90 disabled:opacity-50"
                                        style={{ background: T.goldBg, color: T.gold, border: "1px solid rgba(200,160,52,0.2)" }}
                                    >
                                        {sheetAction === "creating" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                                        {hasDedicatedSheet ? "Create new dedicated sheet" : "Create dedicated sheet"}
                                    </button>
                                </div>

                                <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: T.border }}>
                                    <div>
                                        <div className="text-[13px] font-medium mb-1" style={{ color: T.text }}>Connect existing Google Sheet</div>
                                        <p className="text-[12px] leading-relaxed" style={{ color: T.muted }}>
                                            Paste a Google Sheet URL or spreadsheet ID. Google Docs and CSV files are not writable sync targets here, so convert them into a Google Sheet first.
                                        </p>
                                    </div>

                                    <input
                                        value={sheetInput}
                                        onChange={(e) => setSheetInput(e.target.value)}
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        className={inputCls}
                                        style={{ borderColor: T.border, color: T.text }}
                                    />

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={handleConnectExistingSheet}
                                            disabled={sheetButtonBusy || !business || !bridgeUrl}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all hover:opacity-90 disabled:opacity-50"
                                            style={{ background: "rgba(232,228,221,0.05)", color: T.text, border: `1px solid ${T.border}` }}
                                        >
                                            {sheetAction === "connecting" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CircleCheckBig className="w-3.5 h-3.5" />}
                                            Connect sheet
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleUseSharedFallback}
                                            disabled={sheetButtonBusy || !business}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all hover:opacity-90 disabled:opacity-50"
                                            style={{ background: "rgba(232,228,221,0.03)", color: T.muted, border: `1px solid ${T.border}` }}
                                        >
                                            {sheetAction === "disconnecting" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                                            Use shared fallback
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border px-4 py-4 text-[12px] leading-relaxed space-y-2" style={{ borderColor: T.border, color: T.muted }}>
                                <p>Storage target: <span style={{ color: T.text }}>{business?.google_sheet_tab_name || DEFAULT_BUSINESS_SHEET_TAB}</span> tab</p>
                                <p>Current behavior: the voice agent writes the row to this business sheet when the call is logged, and the same business continues to use the unified Cal.com scheduler until dedicated calendars are switched on.</p>
                                {business?.google_sheet_url && (
                                    <a
                                        href={business.google_sheet_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
                                        style={{ color: T.gold }}
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        Open connected sheet
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {tab !== "notifications" && tab !== "connect" && (
                    <div className="mt-8">
                        <SaveToggle
                            type="submit"
                            size="md"
                            idleText="Save settings"
                            savedText="Settings saved"
                            status={saveStatus}
                            disabled={saveStatus === "loading"}
                            className="hover:opacity-90"
                        />
                    </div>
                )}
            </form>
        </div>
    )
}
