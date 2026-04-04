import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { DEFAULT_BUSINESS_SHEET_TAB, isBusinessSheetSchemaMissing, provisionBusinessSheet } from "@/lib/googleSheet"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, ArrowRight, Check, ArrowLeft } from "lucide-react"

function MandalaDecor({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
            <circle cx="60" cy="60" r="44" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <circle cx="60" cy="60" r="28" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <circle cx="60" cy="60" r="10" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
            {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 45 * Math.PI) / 180
                const x1 = 60 + Math.cos(angle) * 12
                const y1 = 60 + Math.sin(angle) * 12
                const x2 = 60 + Math.cos(angle) * 57
                const y2 = 60 + Math.sin(angle) * 57
                const mx = 60 + Math.cos(angle + Math.PI / 8) * 38
                const my = 60 + Math.sin(angle + Math.PI / 8) * 38
                return <path key={i} d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
            })}
            {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 45 * Math.PI) / 180
                const x = 60 + Math.cos(angle) * 44
                const y = 60 + Math.sin(angle) * 44
                return <rect key={i} x={x - 2} y={y - 2} width="4" height="4" fill="currentColor" transform={`rotate(45 ${x} ${y})`} opacity="0.5" />
            })}
        </svg>
    )
}

export default function SignUp() {
    const { session } = useAuth()
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [businessName, setBusinessName] = useState("")
    const [formLoading, setFormLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    if (session) return <Navigate to="/" replace />

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Math.floor(Math.random() * 1000)
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormLoading(true)
        setError(null)

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } }
        })

        if (authError) {
            setError(authError.message)
            setFormLoading(false)
            return
        }

        if (authData.user) {
            const slug = generateSlug(businessName)
            const bridgeUrl = import.meta.env.VITE_GOOGLE_BRIDGE_URL
            let sheetConfig: {
                google_sheet_id?: string
                google_sheet_url?: string
                google_sheet_tab_name?: string
            } = {}

            if (bridgeUrl) {
                try {
                    const provisioned = await provisionBusinessSheet(bridgeUrl, {
                        businessName,
                        sheetName: DEFAULT_BUSINESS_SHEET_TAB,
                        createDedicatedSpreadsheet: true,
                    })

                    if (provisioned.status === "success" || provisioned.status === "ok") {
                        sheetConfig = {
                            google_sheet_id: provisioned.spreadsheetId || undefined,
                            google_sheet_url: provisioned.spreadsheetUrl || undefined,
                            google_sheet_tab_name: provisioned.sheetName || DEFAULT_BUSINESS_SHEET_TAB,
                        }
                    }
                } catch (bridgeError) {
                    console.warn("Business sheet provisioning failed (non-fatal):", bridgeError)
                }
            }

            const { error: bizError } = await supabase.from("businesses").insert({
                owner_id: authData.user.id,
                name: businessName,
                slug,
                industry: "Healthcare",
                agent_name: "Shubh",
            })

            if (bizError) {
                console.warn("Business record error (non-fatal):", bizError)
            } else if (sheetConfig.google_sheet_id || sheetConfig.google_sheet_url) {
                const { error: sheetError } = await supabase
                    .from("businesses")
                    .update({
                        google_sheet_id: sheetConfig.google_sheet_id ?? null,
                        google_sheet_url: sheetConfig.google_sheet_url ?? null,
                        google_sheet_tab_name: sheetConfig.google_sheet_tab_name || DEFAULT_BUSINESS_SHEET_TAB,
                    })
                    .eq("owner_id", authData.user.id)
                    .eq("slug", slug)

                if (sheetError) {
                    if (isBusinessSheetSchemaMissing(sheetError.message)) {
                        console.warn("Business sheet columns are not migrated in Supabase yet.")
                    } else {
                        console.warn("Business sheet metadata update failed (non-fatal):", sheetError)
                    }
                }
            }

            setSuccess(true)
            setFormLoading(false)
        }
    }

    if (success) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#080808]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <div className="relative w-full max-w-md px-8 text-center">
                    <MandalaDecor className="w-24 h-24 text-amber-400/60 mx-auto mb-8" />
                    <h2 className="text-2xl text-white mb-3"
                        style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>
                        Check your inbox.
                    </h2>
                    <p className="text-[14px] text-white/40 leading-relaxed mb-8">
                        We sent a confirmation link to{" "}
                        <span className="text-white/70">{email}</span>.
                        Click it to activate your account and start your AI agent.
                    </p>
                    <Link to="/login"
                        className="inline-flex items-center gap-2 text-[13px] text-white/40 hover:text-white/70 transition-colors">
                        Back to Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#080808]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

            <div className="hidden lg:block relative w-[55%] h-full overflow-hidden">
                <img
                    src="/india-arch.png"
                    alt="Indian architecture"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-[#080808]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute bottom-12 left-10 right-16">
                    <p className="text-white/70 mb-6"
                        style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.1rem" }}>
                        "Start your AI receptionist in 60 seconds."
                    </p>

                    <div className="space-y-2.5">
                        {[
                            "Speaks Hindi, English & regional dialects",
                            "Books appointments automatically",
                            "Zero missed calls, 24/7",
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                                <div className="w-4 h-4 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-2.5 h-2.5 text-amber-300" />
                                </div>
                                <span className="text-[13px] text-white/50 font-light">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-8 relative overflow-y-auto">
                <MandalaDecor className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] text-white/[0.03] pointer-events-none select-none" />

                <div className="relative z-10 w-full max-w-[380px] py-12">
                    <Link to="/"
                        className="inline-flex items-center gap-1.5 text-[12px] text-white/25 hover:text-white/50 transition-colors mb-8 group">
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        Back to Home
                    </Link>

                    <div className="mb-10">
                        <h2 className="text-[2.8rem] text-white leading-none tracking-tight"
                            style={{ fontFamily: "'Instrument Serif', serif" }}>
                            Awaaz
                        </h2>
                    </div>

                    <div className="mb-10">
                        <h1 className="text-[2rem] leading-tight text-white mb-2"
                            style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>
                            Create your account.
                        </h1>
                        <p className="text-[13px] text-white/35 font-light">
                            Initialize your AI receptionist in seconds.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div>
                            <label className="block text-[11px] text-white/30 font-medium tracking-widest uppercase mb-2">
                                Business Name
                            </label>
                            <input
                                type="text"
                                required
                                value={businessName}
                                onChange={e => setBusinessName(e.target.value)}
                                disabled={formLoading}
                                placeholder="e.g. Sharmaji Dental Hub"
                                className="w-full bg-white/5 border border-white/8 text-white text-[14px] placeholder-white/20 px-4 py-3.5 rounded-xl outline-none focus:border-white/20 focus:bg-white/8 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] text-white/30 font-medium tracking-widest uppercase mb-2">
                                Industry
                            </label>
                            <select
                                required
                                value="Healthcare"
                                onChange={() => {}}
                                disabled={formLoading}
                                className="w-full bg-white/5 border border-white/8 text-white text-[14px] px-4 py-3.5 rounded-xl outline-none focus:border-white/20 focus:bg-white/8 transition-all appearance-none"
                            >
                                <option value="Healthcare" className="bg-[#0d0d0d]">Healthcare / Dental Available</option>
                                <option disabled className="bg-[#0d0d0d] text-white/30">Customer Support - Coming Soon</option>
                                <option disabled className="bg-[#0d0d0d] text-white/30">Survey &amp; Feedback Intake - Coming Soon</option>
                                <option disabled className="bg-[#0d0d0d] text-white/30">Hotel Reservation Agent - Coming Soon</option>
                                <option disabled className="bg-[#0d0d0d] text-white/30">Order Status &amp; Tracking - Coming Soon</option>
                                <option disabled className="bg-[#0d0d0d] text-white/30">Other Business - Coming Soon</option>
                            </select>
                            <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                                More workflows are launching soon. Healthcare / Dental is currently the only selectable option.
                            </p>
                        </div>

                        <div>
                            <label className="block text-[11px] text-white/30 font-medium tracking-widest uppercase mb-2">
                                Owner Name
                            </label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                disabled={formLoading}
                                placeholder="Primary owner name"
                                className="w-full bg-white/5 border border-white/8 text-white text-[14px] placeholder-white/20 px-4 py-3.5 rounded-xl outline-none focus:border-white/20 focus:bg-white/8 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] text-white/30 font-medium tracking-widest uppercase mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={formLoading}
                                placeholder="your@email.com"
                                className="w-full bg-white/5 border border-white/8 text-white text-[14px] placeholder-white/20 px-4 py-3.5 rounded-xl outline-none focus:border-white/20 focus:bg-white/8 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] text-white/30 font-medium tracking-widest uppercase mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={formLoading}
                                placeholder="........"
                                className="w-full bg-white/5 border border-white/8 text-white text-[14px] placeholder-white/20 px-4 py-3.5 rounded-xl outline-none focus:border-white/20 focus:bg-white/8 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={formLoading}
                            className="w-full flex items-center justify-center gap-2 bg-white text-black text-[14px] font-semibold py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                        >
                            {formLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="my-8 flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/6" />
                        <span className="text-[11px] text-white/20 font-medium">Already have an account?</span>
                        <div className="h-px flex-1 bg-white/6" />
                    </div>

                    <Link to="/login"
                        className="w-full flex items-center justify-center gap-2 border border-white/10 text-white/50 text-[13px] font-medium py-3.5 rounded-xl hover:border-white/20 hover:text-white/70 transition-all">
                        Sign in instead
                    </Link>
                </div>
            </div>
        </div>
    )
}
