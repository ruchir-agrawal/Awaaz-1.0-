import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react"

// Decorative SVG mandala
function MandalaDecor({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
            <circle cx="60" cy="60" r="44" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <circle cx="60" cy="60" r="28" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <circle cx="60" cy="60" r="10" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
            {/* 8-petal lotus-like star */}
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
            {/* Diamond markers */}
            {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 45 * Math.PI) / 180
                const x = 60 + Math.cos(angle) * 44
                const y = 60 + Math.sin(angle) * 44
                return <rect key={i} x={x - 2} y={y - 2} width="4" height="4" fill="currentColor" transform={`rotate(45 ${x} ${y})`} opacity="0.5" />
            })}
        </svg>
    )
}

export default function Login() {
    const { session, userRole, loading: authLoading } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [formLoading, setFormLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (session && !authLoading) {
        if (userRole === 'admin') return <Navigate to="/admin" replace />
        return <Navigate to="/owner" replace />
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormLoading(true)
        setError(null)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setError(error.message)
            setFormLoading(false)
        }
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#080808]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

            {/* ── LEFT PANEL — India Visual ── */}
            <div className="hidden lg:block relative w-[55%] h-full overflow-hidden">
                <img
                    src="/india-arch.png"
                    alt="Indian architecture"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Dark overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-[#080808]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Quote overlay at bottom */}
                <div className="absolute bottom-12 left-10 right-10">
                    <p className="text-white/50 font-light leading-relaxed max-w-xs"
                        style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: "1.1rem" }}>
                        "Har Awaaz Ko Suna Jana Chahiye."
                    </p>
                    <p className="text-white/25 text-[11px] mt-2 tracking-wide">Every voice deserves to be heard.</p>
                </div>
            </div>

            {/* ── RIGHT PANEL — Login Form ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
                {/* Subtle mandala watermark */}
                <MandalaDecor className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] text-white/[0.03] pointer-events-none select-none" />

                <div className="relative z-10 w-full max-w-[380px]">
                    {/* Back to Landing */}
                    <Link to="/"
                        className="inline-flex items-center gap-1.5 text-[12px] text-white/25 hover:text-white/50 transition-colors mb-8 group">
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        Back to Home
                    </Link>

                    {/* Top brand title */}
                    <div className="mb-10">
                        <h2 className="text-[2.8rem] text-white leading-none tracking-tight"
                            style={{ fontFamily: "'Instrument Serif', serif" }}>
                            Awaaz
                        </h2>
                    </div>

                    {/* Headline */}
                    <div className="mb-10">
                        <h1 className="text-[2rem] leading-tight text-white mb-2"
                            style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>
                            Welcome back.
                        </h1>
                        <p className="text-[13px] text-white/35 font-light">
                            Sign in to your dashboard.
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px]">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email */}
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

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[11px] text-white/30 font-medium tracking-widest uppercase">
                                    Password
                                </label>
                                <a href="#" className="text-[11px] text-white/25 hover:text-white/50 transition-colors">
                                    Forgot?
                                </a>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={formLoading}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/8 text-white text-[14px] placeholder-white/20 px-4 py-3.5 rounded-xl outline-none focus:border-white/20 focus:bg-white/8 transition-all"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={formLoading}
                            className="w-full flex items-center justify-center gap-2 bg-white text-black text-[14px] font-semibold py-3.5 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                        >
                            {formLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-8 flex items-center gap-4">
                        <div className="h-px flex-1 bg-white/6" />
                        <span className="text-[11px] text-white/20 font-medium">New to Awaaz?</span>
                        <div className="h-px flex-1 bg-white/6" />
                    </div>

                    <Link to="/signup"
                        className="w-full flex items-center justify-center gap-2 border border-white/10 text-white/50 text-[13px] font-medium py-3.5 rounded-xl hover:border-white/20 hover:text-white/70 transition-all">
                        Create an account
                    </Link>


                </div>
            </div>
        </div>
    )
}
