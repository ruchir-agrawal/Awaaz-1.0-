import { Link } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { ShaderAnimation } from "@/components/ui/shader-animation"
import { useEffect, useRef, useState } from "react"
import { ArrowRight, ArrowUpRight, Mic, Phone, Globe } from "lucide-react"

// Marquee Ticker Component
function Marquee({ items }: { items: string[] }) {
    return (
        <div className="overflow-hidden border-y border-white/10 py-4 relative">
            <div className="flex animate-marquee whitespace-nowrap">
                {[...items, ...items].map((item, i) => (
                    <span key={i} className="mx-12 text-sm font-medium tracking-[0.25em] uppercase text-white/40">
                        {item}
                        <span className="ml-12 text-white/20">✦</span>
                    </span>
                ))}
            </div>
        </div>
    )
}

// Animated counter
function Counter({ target, suffix = "" }: { target: number, suffix?: string }) {
    const [count, setCount] = useState(0)
    const ref = useRef<HTMLDivElement>(null)
    const started = useRef(false)

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true
                let start = 0
                const duration = 1800
                const step = Math.ceil(target / (duration / 16))
                const timer = setInterval(() => {
                    start = Math.min(start + step, target)
                    setCount(start)
                    if (start >= target) clearInterval(timer)
                }, 16)
            }
        }, { threshold: 0.5 })
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [target])

    return <div ref={ref}>{count.toLocaleString()}{suffix}</div>
}

export default function Landing() {
    const { session, loading } = useAuth()
    const cursorRef = useRef<HTMLDivElement>(null)
    const cursorDotRef = useRef<HTMLDivElement>(null)

    // Custom cursor
    useEffect(() => {
        let x = 0, y = 0, cx = 0, cy = 0
        const handleMove = (e: MouseEvent) => { x = e.clientX; y = e.clientY }
        const animate = () => {
            cx += (x - cx) * 0.12
            cy += (y - cy) * 0.12
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate(${cx - 16}px, ${cy - 16}px)`
            }
            if (cursorDotRef.current) {
                cursorDotRef.current.style.transform = `translate(${x - 3}px, ${y - 3}px)`
            }
            requestAnimationFrame(animate)
        }
        window.addEventListener("mousemove", handleMove)
        animate()
        return () => window.removeEventListener("mousemove", handleMove)
    }, [])

    const marqueeItems = [
        "Voice AI", "Hindi & English", "24/7 Receptionist", "Auto Bookings",
        "Real-time Transcripts", "Indian SMEs", "No Code Setup", "Multilingual"
    ]

    return (
        <div className="bg-[#080808] text-[#f0ede8] min-h-screen overflow-x-hidden"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

            {/* Custom Cursor */}
            <div ref={cursorRef} className="fixed top-0 left-0 z-[9999] w-8 h-8 rounded-full border border-white/40 pointer-events-none mix-blend-difference transition-opacity" />
            <div ref={cursorDotRef} className="fixed top-0 left-0 z-[9999] w-1.5 h-1.5 rounded-full bg-white pointer-events-none" />

            {/* ── NAV ── */}
            <nav className="fixed top-0 w-full z-50">
                <div className="max-w-7xl mx-auto px-8 h-[72px] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                            <Mic className="w-3.5 h-3.5 text-black" />
                        </div>
                        <span className="text-[15px] font-semibold tracking-tight">Awaaz</span>
                    </div>

                    <div className="hidden md:flex items-center gap-10 text-[13px] text-white/50 font-medium">
                        <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
                        <a href="#about" className="hover:text-white transition-colors duration-200">Mission</a>
                        <a href="#how" className="hover:text-white transition-colors duration-200">How it works</a>
                    </div>

                    <div className="flex items-center gap-4">
                        {loading ? (
                            <div className="w-20 h-8 bg-white/5 rounded-full animate-pulse" />
                        ) : session ? (
                            <Link to="/dashboard"
                                className="flex items-center gap-2 text-[13px] font-semibold bg-white text-black px-5 py-2 rounded-full hover:bg-white/90 transition-colors">
                                Dashboard <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-[13px] text-white/50 hover:text-white transition-colors font-medium">
                                    Log in
                                </Link>
                                <Link to="/signup"
                                    className="flex items-center gap-2 text-[13px] font-semibold bg-white text-black px-5 py-2 rounded-full hover:bg-white/90 transition-colors">
                                    Get Started <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
                {/* Shader as atmospheric texture */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0" style={{ opacity: 0.18, mixBlendMode: "screen" }}>
                        <ShaderAnimation />
                    </div>
                    {/* Radial vignette to frame the shader nicely */}
                    <div className="absolute inset-0 bg-[#080808]" style={{
                        background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, #080808 70%)"
                    }} />
                    {/* Bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#080808] to-transparent" />
                </div>

                {/* Grid overlay texture */}
                <div className="absolute inset-0 z-0 opacity-[0.03]"
                    style={{
                        backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                        backgroundSize: "64px 64px"
                    }} />

                <div className="relative z-10 max-w-7xl mx-auto px-8 pt-32 pb-24">
                    {/* Status pill */}
                    <div className="inline-flex items-center gap-2.5 mb-10">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs text-white/40 font-medium tracking-widest uppercase">
                            Live — AI Receptionist for India
                        </span>
                    </div>

                    {/* Hero headline — editorial serif italic + clean numbers */}
                    <h1 className="text-[clamp(3.5rem,10vw,9rem)] leading-[0.9] tracking-tight mb-10">
                        <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
                            className="block text-white">
                            Never miss
                        </span>
                        <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
                            className="block text-white/20">
                            a customer
                        </span>
                        <span className="block font-light text-white/80"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            again.
                        </span>
                    </h1>

                    <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-12">
                        <p className="max-w-md text-[17px] text-white/40 leading-relaxed font-light">
                            Awaaz is a voice AI that answers your business calls 24/7 in Hindi, English, and regional dialects — booking appointments, routing leads, and logging every conversation.
                        </p>

                        <div className="flex items-center gap-4">
                            <Link to="/signup"
                                className="group flex items-center gap-3 bg-white text-black text-[14px] font-semibold px-7 py-4 rounded-full hover:bg-white/90 transition-all">
                                Start for free
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Link>
                            <Link to="/login"
                                className="text-[14px] text-white/40 hover:text-white transition-colors font-medium border border-white/10 px-7 py-4 rounded-full hover:border-white/30">
                                See demo
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Floating stat pill */}
                <div className="absolute bottom-16 right-8 hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md px-5 py-3 rounded-2xl">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <div>
                        <div className="text-xs text-white/40">Calls handled today</div>
                        <div className="text-sm font-semibold">2,847</div>
                    </div>
                </div>
            </section>

            {/* ── MARQUEE ── */}
            <Marquee items={marqueeItems} />

            {/* ── STATS ── */}
            <section className="py-32 max-w-7xl mx-auto px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-3xl overflow-hidden">
                    {[
                        { value: 99, suffix: ".9%", label: "Call answer rate" },
                        { value: 24, suffix: "/7", label: "Always on, always ready" },
                        { value: 12, suffix: "+", label: "Indian dialects supported" },
                        { value: 60, suffix: "s", label: "Setup time, literally" },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#0e0e0e] px-10 py-14 group hover:bg-[#131313] transition-colors">
                            <div className="text-[clamp(2.5rem,5vw,4rem)] font-bold text-white leading-none mb-3 tabular-nums">
                                <Counter target={stat.value} suffix={stat.suffix} />
                            </div>
                            <div className="text-sm text-white/30 font-medium">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" className="py-12 max-w-7xl mx-auto px-8">
                {/* Section label */}
                <div className="flex items-center gap-4 mb-20">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-[11px] text-white/30 tracking-[0.25em] uppercase font-medium">What Awaaz does</span>
                    <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="grid md:grid-cols-3 gap-px bg-white/5 rounded-3xl overflow-hidden">
                    {[
                        {
                            icon: Globe,
                            number: "01",
                            title: "Vernacular First",
                            body: "Native Hindi, English, Gujarati, Marathi support. The AI mirrors the customer's language and accent naturally — no awkward robotic tone."
                        },
                        {
                            icon: Phone,
                            number: "02",
                            title: "Auto Bookings",
                            body: "The agent checks your calendar in real-time and books appointments directly during the conversation — zero human intervention needed."
                        },
                        {
                            icon: Mic,
                            number: "03",
                            title: "Full Transcripts",
                            body: "Every call is logged, transcribed and categorized. Know exactly what every customer said, when they called, and what happened."
                        },
                    ].map((f, i) => (
                        <div key={i} className="bg-[#0e0e0e] p-10 group hover:bg-[#141414] transition-all duration-300">
                            <div className="flex items-start justify-between mb-16">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                    <f.icon className="w-4.5 h-4.5 text-white/60" />
                                </div>
                                <span className="text-[11px] text-white/20 tabular-nums font-mono">{f.number}</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">{f.title}</h3>
                            <p className="text-sm text-white/35 leading-relaxed font-light">{f.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── MISSION ── */}
            <section id="about" className="py-40 max-w-7xl mx-auto px-8">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <div className="text-[11px] text-white/25 tracking-[0.25em] uppercase font-medium mb-8">Our mission</div>
                        <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] font-light mb-8">
                            <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
                                className="text-white">Every</span>{" "}
                            business in India deserves a{" "}
                            <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}
                                className="text-white/50">voice.</span>
                        </h2>
                        <div className="space-y-5 text-[15px] text-white/40 leading-relaxed font-light">
                            <p>
                                Millions of business opportunities vanish in India every day — a missed call from a customer who needed a dentist, a lead who hung up because no one answered at midnight.
                            </p>
                            <p>
                                Awaaz was built to end that. We give every small business — the clinic, the salon, the real estate office — an AI receptionist that speaks like a human and works like a machine.
                            </p>
                        </div>

                        <Link to="/signup"
                            className="inline-flex items-center gap-2 mt-12 text-[13px] font-semibold text-white border-b border-white/20 pb-1 hover:border-white transition-colors group">
                            Build your agent now
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                    </div>

                    {/* Visual: Stylized call card */}
                    <div className="relative">
                        {/* Glow */}
                        <div className="absolute inset-0 bg-white/3 blur-3xl rounded-full scale-75" />

                        <div className="relative bg-[#111] border border-white/8 rounded-3xl p-8 space-y-4">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-xs text-white/30 font-medium uppercase tracking-widest">Live call</span>
                                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                    Recording
                                </span>
                            </div>

                            {[
                                { who: "Customer", text: "Mujhe kal 4 baje appointment chahiye", lang: "Hindi" },
                                { who: "Awaaz AI", text: "Sure! Booking confirmed — see you at 4 PM tomorrow.", lang: "English" },
                                { who: "Customer", text: "Thank you bhai, bahut helpful the aap 🙏", lang: null },
                            ].map((msg, i) => (
                                <div key={i} className={`flex gap-3 items-start ${msg.who === 'Awaaz AI' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${msg.who === 'Awaaz AI' ? 'bg-white text-black' : 'bg-white/10 text-white/60'}`}>
                                        {msg.who === 'Awaaz AI' ? 'AI' : 'C'}
                                    </div>
                                    <div className={`max-w-[75%] ${msg.who === 'Awaaz AI' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                        <div className={`px-4 py-2.5 rounded-2xl text-[13px] ${msg.who === 'Awaaz AI' ? 'bg-white text-black' : 'bg-white/8 text-white/70'}`}>
                                            {msg.text}
                                        </div>
                                        {msg.lang && (
                                            <span className="text-[10px] text-white/20 px-1">{msg.lang} detected</span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-xs text-white/25">Appointment booked automatically</span>
                                <span className="text-xs text-emerald-400 font-medium">✓ Confirmed</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ── */}
            <section id="how" className="py-24 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="text-[11px] text-white/25 tracking-[0.25em] uppercase font-medium mb-20 text-center">
                        Three steps to zero missed calls
                    </div>

                    <div className="grid md:grid-cols-3 gap-16">
                        {[
                            { n: "01", title: "Sign up", body: "Create your account in 30 seconds — just your name and email. No credit card." },
                            { n: "02", title: "Configure", body: "Set your business hours, languages, voice tone, and your AI's personality prompt." },
                            { n: "03", title: "Go live", body: "Share your voice link or connect your phone number. Your agent starts answering immediately." },
                        ].map((step, i) => (
                            <div key={i} className="relative group">
                                <div className="text-[80px] font-bold text-white/[0.03] leading-none mb-6 tabular-nums select-none group-hover:text-white/[0.06] transition-colors duration-500">
                                    {step.n}
                                </div>
                                <h4 className="text-lg font-semibold text-white mb-3">{step.title}</h4>
                                <p className="text-sm text-white/35 leading-relaxed font-light">{step.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA SECTION ── */}
            <section className="py-40 max-w-7xl mx-auto px-8">
                <div className="relative rounded-[2.5rem] overflow-hidden border border-white/8 bg-[#0e0e0e]">
                    {/* Shader as bg texture here too */}
                    <div className="absolute inset-0" style={{ opacity: 0.12, mixBlendMode: "screen" }}>
                        <ShaderAnimation />
                    </div>
                    <div className="absolute inset-0" style={{
                        background: "radial-gradient(ellipse 70% 70% at 50% 100%, transparent 0%, #0e0e0e 70%)"
                    }} />

                    <div className="relative z-10 text-center py-24 px-8">
                        <div className="text-[11px] text-white/25 tracking-[0.25em] uppercase font-medium mb-8">
                            Ready when you are
                        </div>
                        <h2 className="text-[clamp(2.5rem,6vw,5.5rem)] leading-[1.05] mb-10">
                            <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }} className="text-white">
                                Your AI receptionist
                            </span>
                            <br />
                            <span className="text-white/30 font-light">is one click away.</span>
                        </h2>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to="/signup"
                                className="group flex items-center gap-2 bg-white text-black text-[14px] font-semibold px-8 py-4 rounded-full hover:bg-white/90 transition-all">
                                Start for free — no card needed
                                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-white/5 py-12">
                <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                            <Mic className="w-3 h-3 text-black" />
                        </div>
                        <span className="text-[13px] font-semibold">Awaaz</span>
                    </div>
                    <p className="text-[12px] text-white/20 font-medium">
                        © 2026 Awaaz AI · Built for Bharat
                    </p>
                    <div className="flex items-center gap-8 text-[12px] text-white/25 font-medium">
                        <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
                        <a href="mailto:hello@awaaz.ai" className="hover:text-white/60 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
