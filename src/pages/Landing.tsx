import { useEffect, useRef, useState } from "react"
import Lenis from "lenis"
import { Link } from "react-router-dom"
import { ArrowRight, ArrowUpRight, Globe, Mic, Phone } from "lucide-react"
import { HeroVoiceExperience } from "@/components/landing/HeroVoiceExperience"
import { ShaderAnimation } from "@/components/ui/shader-animation"
import { useAuth } from "@/contexts/AuthContext"

function Marquee({ items }: { items: string[] }) {
    return (
        <div className="relative overflow-hidden border-y border-white/5 py-6">
            <div className="flex animate-marquee whitespace-nowrap">
                {[...items, ...items].map((item, index) => (
                    <span key={`${item}-${index}`} className="mx-12 text-[13px] font-medium uppercase tracking-[0.3em] text-white/30">
                        {item}
                        <span className="ml-12 text-white/10">*</span>
                    </span>
                ))}
            </div>
        </div>
    )
}

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0)
    const ref = useRef<HTMLDivElement>(null)
    const started = useRef(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true
                    let current = 0
                    const duration = 1800
                    const step = Math.ceil(target / (duration / 16))
                    const timer = setInterval(() => {
                        current = Math.min(current + step, target)
                        setCount(current)
                        if (current >= target) clearInterval(timer)
                    }, 16)
                }
            },
            { threshold: 0.5 }
        )

        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [target])

    return (
        <div ref={ref}>
            {count.toLocaleString()}
            {suffix}
        </div>
    )
}

export default function Landing() {
    const { session, loading } = useAuth()

    useEffect(() => {
        const lenis = new Lenis()
        const raf = (time: number) => {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)
        return () => lenis.destroy()
    }, [])

    const marqueeItems = [
        "Voice AI",
        "Hindi & English",
        "24/7 Receptionist",
        "Auto Bookings",
        "Real-time Transcripts",
        "Indian SMEs",
        "No Code Setup",
        "Multilingual",
    ]

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#080808] text-[#f0ede8]" style={{ fontFamily: "'Inter', sans-serif", fontSize: "15px" }}>
            <header className="fixed top-3 sm:top-5 z-50 flex w-full justify-center px-3 sm:px-6">
                <nav className="flex max-w-[95vw] sm:max-w-fit items-center justify-between space-x-3 sm:space-x-8 md:space-x-10 rounded-full border border-white/5 bg-white/[0.03] px-3.5 sm:px-7 py-2.5 sm:py-3 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-2 sm:gap-3 border-r border-white/5 pr-2.5 sm:pr-4">
                        <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-white">
                            <Mic className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />
                        </div>
                        <span className="text-lg sm:text-xl tracking-tighter" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 600 }}>
                            Awaaz
                        </span>
                    </div>

                    <div className="hidden items-center gap-8 text-[15px] font-medium text-white/40 md:flex">
                        <a href="#features" className="transition-all duration-300 hover:text-white">Features</a>
                        <a href="#about" className="transition-all duration-300 hover:text-white">Mission</a>
                        <a href="#how" className="transition-all duration-300 hover:text-white">How it works</a>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6 border-l border-white/5 pl-2.5 sm:pl-4">
                        {loading ? (
                            <div className="h-8 w-16 animate-pulse rounded-full bg-white/5" />
                        ) : session ? (
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white px-3.5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-[14px] font-semibold text-black shadow-lg transition-all hover:bg-white/90 active:scale-95 whitespace-nowrap"
                            >
                                Dashboard <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3 sm:gap-6 md:gap-8">
                                <Link to="/login" className="text-xs sm:text-[14px] font-semibold text-white/50 transition-colors hover:text-white whitespace-nowrap">
                                    Log in
                                </Link>
                                <Link
                                    to="/signup"
                                    className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-white px-3.5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-[14px] font-semibold text-black shadow-lg transition-all hover:bg-white/90 active:scale-95 whitespace-nowrap"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>
            </header>

            <section className="relative flex min-h-screen flex-col justify-center overflow-hidden pt-16">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0" style={{ opacity: 0.15, mixBlendMode: "screen" }}>
                        <ShaderAnimation />
                    </div>
                    <div
                        className="absolute inset-0 bg-[#080808]"
                        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, #080808 75%)" }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#080808] to-transparent" />
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 md:px-8 pb-12 sm:pb-16 pt-20 sm:pt-24 xl:-translate-x-12">
                    <div className="grid gap-10 xl:grid-cols-2 xl:items-center">
                        <div className="text-center xl:text-left">
                            <h1 className="mb-6 sm:mb-8 text-[clamp(2.4rem,6.8vw,6.8rem)] leading-[0.89] tracking-tight">
                                <span className="block text-white" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>
                                    Never miss
                                </span>
                                <span className="block text-white/10" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>
                                    a customer
                                </span>
                                <span className="block font-black text-white/90" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.05em" }}>
                                    again.
                                </span>
                            </h1>

                            <p className="mx-auto xl:mx-0 max-w-xl text-[15px] sm:text-[16px] leading-[1.65] text-white/35">
                                Awaaz handles your business calls 24/7 in native dialects, booking appointments, routing leads, and ensuring no revenue is ever left on the table.
                            </p>

                            <div className="mt-8 sm:mt-10 flex justify-center xl:justify-start">
                                <Link
                                    to="/signup"
                                    className="group inline-flex h-[48px] sm:h-[52px] items-center gap-3 rounded-full bg-white px-6 sm:px-8 text-xs sm:text-[14px] font-black text-black shadow-2xl transition-all hover:bg-white/90 active:scale-95"
                                >
                                    Start for free
                                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center justify-center xl:justify-end">
                            <HeroVoiceExperience />
                        </div>
                    </div>
                </div>
            </section>

            <Marquee items={marqueeItems} />

            <section className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-28">
                <div className="grid gap-px overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-white/5 bg-white/5 grid-cols-1 sm:grid-cols-3">
                    {[
                        { value: 24, suffix: "/7", label: "Always active agent" },
                        { value: 22, suffix: "+", label: "Indian dialects supported" },
                        { value: 60, suffix: "s", label: "Ready to deploy" },
                    ].map(stat => (
                        <div key={stat.label} className="bg-[#0b0b0b] px-6 py-6 sm:px-9 sm:py-9 transition-colors hover:bg-[#111] text-center sm:text-left">
                            <div
                                className="mb-2 sm:mb-3 text-[clamp(1.8rem,4vw,2.5rem)] font-black leading-none text-white tabular-nums"
                                style={{ fontFamily: "'Syne', sans-serif" }}
                            >
                                <Counter target={stat.value} suffix={stat.suffix} />
                            </div>
                            <div className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wide text-white/40">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-14 sm:py-20">
                <div className="mb-10 sm:mb-16 flex items-center gap-4 sm:gap-8">
                    <span className="shrink-0 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] text-white/20">Capabilities</span>
                    <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                </div>

                <div className="grid gap-px overflow-hidden rounded-2xl sm:rounded-[2.5rem] border border-white/5 bg-white/5 grid-cols-1 md:grid-cols-3">
                    {[
                        {
                            icon: Globe,
                            number: "01",
                            title: "Vernacular First",
                            body: "Native support for 22+ regional languages. The AI adapts to the caller's language and accent naturally for zero-friction conversations.",
                        },
                        {
                            icon: Phone,
                            number: "02",
                            title: "Intelligent Inbound",
                            body: "Get a dedicated AI number or route your existing business line. Our systems handle everything from scheduling to complex lead routing.",
                        },
                        {
                            icon: Mic,
                            number: "03",
                            title: "Instant Insights",
                            body: "Every call is categorized, transcribed, and summarized in real-time. Know exactly what your customers want before you even call them back.",
                        },
                    ].map(feature => (
                        <div key={feature.number} className="group bg-[#0b0b0b] p-6 sm:p-8 md:p-10 transition-all duration-500 hover:bg-[#141414]">
                            <div className="mb-8 sm:mb-14 flex items-start justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-white/5 transition-colors group-hover:bg-white/10">
                                    <feature.icon className="h-4 w-4 text-white/50" />
                                </div>
                                <span className="text-[12px] font-black tabular-nums text-white/15" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    {feature.number}
                                </span>
                            </div>
                            <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-black uppercase tracking-tighter text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                                {feature.title}
                            </h3>
                            <p className="text-[13px] sm:text-[14px] font-medium leading-relaxed text-white/30">{feature.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
                <div className="grid items-center gap-12 lg:gap-32 lg:grid-cols-2">
                    <div>
                        <div className="mb-6 sm:mb-10 text-[11px] sm:text-[13px] font-black uppercase tracking-[0.3em] text-white/20">Our mission</div>
                        <h2 className="mb-6 sm:mb-10 text-[clamp(2rem,4.5vw,4rem)] leading-[0.95]">
                            <span className="text-white" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>
                                Every
                            </span>{" "}
                            business deserves a{" "}
                            <span className="text-white/40" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>
                                voice.
                            </span>
                        </h2>
                        <div className="space-y-4 sm:space-y-6 text-[14px] sm:text-[15px] font-medium leading-relaxed text-white/30">
                            <p>
                                Awaaz was built to bridge the gap between small businesses and their customers. We give every clinic, salon, and office an AI receptionist that works 24/7.
                            </p>
                            <p>
                                No more missed opportunities. No more leads lost to voicemail. Just seamless human-like interactions at scale.
                            </p>
                        </div>

                        <Link
                            to="/signup"
                            className="group mt-10 sm:mt-16 inline-flex items-center gap-3 border-b-2 border-white/10 pb-2 text-[14px] sm:text-[15px] font-black text-white transition-all hover:border-white"
                        >
                            Build your agent now
                            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </Link>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 scale-90 rounded-full bg-white/5 blur-[120px]" />
                        <div className="relative rounded-2xl sm:rounded-[3rem] border border-white/5 bg-[#0d0d0d]/80 p-5 sm:p-8 md:p-10 shadow-2xl backdrop-blur-md">
                            <div className="mb-6 sm:mb-10 flex items-center justify-between">
                                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-white/20">AI Stream</span>
                                <span className="flex items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-400/5 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase tracking-widest text-emerald-400">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                                    Active
                                </span>
                            </div>

                            <div className="space-y-4 sm:space-y-6">
                                {[
                                    { who: "Customer", text: "Is there a slot for tomorrow at 4 PM?", lang: "English" },
                                    { who: "Awaaz AI", text: "Searching... Yes! Slot confirmed for Dr. Sharma.", lang: "Real-time" },
                                    { who: "Customer", text: "Great, see you then!", lang: null },
                                ].map(message => (
                                    <div key={`${message.who}-${message.text}`} className={`flex items-start gap-3 sm:gap-4 ${message.who === "Awaaz AI" ? "flex-row-reverse" : ""}`}>
                                        <div
                                            className={`flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-xl text-[10px] sm:text-[11px] font-black ${message.who === "Awaaz AI"
                                                    ? "bg-white text-black"
                                                    : "border border-white/5 bg-white/5 text-white/40"
                                                }`}
                                        >
                                            {message.who === "Awaaz AI" ? "AI" : "C"}
                                        </div>
                                        <div className={`flex max-w-[85%] sm:max-w-[75%] flex-col gap-1.5 ${message.who === "Awaaz AI" ? "items-end" : "items-start"}`}>
                                            <div
                                                className={`rounded-[1.2rem] sm:rounded-[1.5rem] px-4 sm:px-5 py-2.5 sm:py-3.5 text-[13px] sm:text-[15px] font-medium ${message.who === "Awaaz AI"
                                                        ? "bg-white leading-snug text-black"
                                                        : "border border-white/5 bg-white/5 text-white/70"
                                                    }`}
                                            >
                                                {message.text}
                                            </div>
                                            {message.lang && (
                                                <span className="px-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/15">{message.lang}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="how" className="relative border-t border-white/5 bg-[#0b0b0b] py-16 sm:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                    <div className="mb-10 sm:mb-16 text-center text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] text-white/20">
                        Operation Lifecycle
                    </div>

                    <div className="grid gap-8 sm:gap-10 md:gap-14 grid-cols-1 md:grid-cols-3">
                        {[
                            { n: "01", title: "Sign up", body: "Initialize your account with just your name and email. No cards required." },
                            { n: "02", title: "Configure", body: "Fill out your business details, hours, address, and tone, so your AI knows its workspace." },
                            { n: "03", title: "Go Live", body: "Get your dedicated AI number or connect your existing line. Your agent starts answering immediately." },
                        ].map(step => (
                            <div key={step.n} className="group relative text-center md:text-left">
                                <div
                                    className="mb-4 sm:mb-6 select-none text-[60px] sm:text-[90px] font-black leading-[0.8] text-white/[0.04] tabular-nums transition-all duration-700 group-hover:scale-110 group-hover:text-white/[0.08]"
                                    style={{ fontFamily: "'Syne', sans-serif", transformOrigin: "left" }}
                                >
                                    {step.n}
                                </div>
                                <h4 className="mb-2 sm:mb-3 text-lg sm:text-xl font-black uppercase tracking-tighter text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    {step.title}
                                </h4>
                                <p className="mx-auto max-w-[260px] text-[13px] sm:text-[14px] font-medium leading-relaxed text-white/30 md:mx-0">{step.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32">
                <div className="relative overflow-hidden rounded-2xl sm:rounded-[3rem] border border-white/5 bg-[#0e0e0e] shadow-2xl">
                    <div className="absolute inset-0" style={{ opacity: 0.12, mixBlendMode: "screen" }}>
                        <ShaderAnimation />
                    </div>
                    <div
                        className="absolute inset-0"
                        style={{ background: "radial-gradient(ellipse 70% 70% at 50% 100%, transparent 0%, #0e0e0e 80%)" }}
                    />

                    <div className="relative z-10 px-4 sm:px-8 py-14 sm:py-24 text-center">
                        <div className="mb-6 sm:mb-8 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.4em] text-white/20">
                            Ready to transform?
                        </div>
                        <h2 className="mb-8 sm:mb-12 text-[clamp(2rem,6vw,5.5rem)] leading-[0.92] tracking-tighter">
                            <span className="text-white" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>
                                Your receptionist
                            </span>
                            <br />
                            <span className="font-black text-white/20" style={{ fontFamily: "'Syne', sans-serif" }}>
                                is one click away.
                            </span>
                        </h2>

                        <Link
                            to="/signup"
                            className="group inline-flex items-center gap-3 rounded-full bg-white px-6 sm:px-10 py-3.5 sm:py-5 text-[13px] sm:text-[15px] font-black text-black shadow-2xl transition-all hover:bg-white/90 active:scale-95"
                        >
                            Start for free - no card needed
                            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="border-t border-white/5 bg-[#080808] py-12 sm:py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white">
                            <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                        </div>
                        <span className="text-3xl sm:text-4xl tracking-tighter text-white" style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 600 }}>
                            Awaaz
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    )
}
