import { Outlet, Link, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { LayoutDashboard, Users, ActivitySquare, Server, CreditCard, LogOut, Menu, X, Bot } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const D = "'Syne', sans-serif"
const T = {
    text: "#e8e4dd",
    muted: "rgba(232,228,221,0.38)",
    ghost: "rgba(232,228,221,0.1)",
    border: "rgba(232,228,221,0.07)",
    terra: "#b85c35",
}

function Mark() {
    return (
        <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
            <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
            <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
            <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.6" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
                const r = a * Math.PI / 180
                return <line key={a}
                    x1={16 + Math.cos(r) * 4} y1={16 + Math.sin(r) * 4}
                    x2={16 + Math.cos(r) * 14} y2={16 + Math.sin(r) * 14}
                    stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            })}
        </svg>
    )
}

const nav = [
    { label: "Overview", to: "/admin", icon: LayoutDashboard },
    { label: "All Owners", to: "/admin/owners", icon: Users },
    { label: "Agent Playground", to: "/admin/playground", icon: Bot },
    { label: "System Health", to: "/admin/health", icon: ActivitySquare },
    { label: "API Monitor", to: "/admin/api-monitor", icon: Server },
    { label: "Billing", to: "/admin/billing", icon: CreditCard },
]

function Sidebar({ close, signOut, path }: any) {
    return (
        <div className="flex flex-col h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Brand */}
            <div className="px-6 pt-8 pb-5" style={{ color: T.text }}>
                <div className="flex items-center gap-2.5 mb-4">
                    <Mark />
                    <span style={{ fontFamily: D, fontWeight: 700, fontSize: "18px", letterSpacing: "-0.02em" }}>Awaaz</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-[0.15em]"
                    style={{ color: T.terra, background: "rgba(184,92,53,0.1)", border: "1px solid rgba(184,92,53,0.2)" }}>
                    <span className="w-1 h-1 rounded-full bg-[#b85c35]" />
                    Admin Console
                </div>
            </div>

            <div className="h-px mx-6 mb-4" style={{ background: T.border }} />

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-0.5">
                {nav.map(item => {
                    const active = path === item.to || (path === "/admin/" && item.to === "/admin")
                    return (
                        <Link key={item.label} to={item.to} onClick={close}
                            className={cn(
                                "flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-lg text-[13px] font-medium transition-all border-l-2",
                                active
                                    ? "border-[#b85c35] bg-[rgba(184,92,53,0.07)]"
                                    : "border-transparent hover:bg-[rgba(232,228,221,0.04)]"
                            )}
                            style={{ color: active ? T.text : T.muted }}>
                            <item.icon className="w-[15px] h-[15px] shrink-0" style={{ opacity: active ? 1 : 0.6 }} />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-3 pt-0">
                <div className="h-px mb-3" style={{ background: T.border }} />
                <button onClick={signOut}
                    className="w-full flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-lg text-[13px] transition-all border-l-2 border-transparent hover:bg-[rgba(232,228,221,0.04)]"
                    style={{ color: T.muted, fontFamily: "'Inter', sans-serif" }}>
                    <LogOut className="w-[15px] h-[15px] opacity-60" />
                    Sign out
                </button>
            </div>
        </div>
    )
}

export function AdminLayout() {
    const { signOut } = useAuth()
    const { pathname } = useLocation()
    const [open, setOpen] = useState(false)
    const sp = { close: () => setOpen(false), signOut, path: pathname }

    return (
        <div className="min-h-screen" style={{ background: "#080808", fontFamily: "'Inter', sans-serif" }}>
            <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-[220px] lg:flex-col"
                style={{ background: "#0a0a0a", borderRight: `1px solid ${T.border}` }}>
                <Sidebar {...sp} />
            </aside>

            <header className="lg:hidden flex h-14 items-center justify-between px-5 border-b"
                style={{ background: "#0a0a0a", borderColor: T.border }}>
                <div className="flex items-center gap-2" style={{ color: T.text }}>
                    <Mark />
                    <span style={{ fontFamily: D, fontWeight: 700, fontSize: "16px" }}>Awaaz</span>
                </div>
                <button onClick={() => setOpen(!open)} style={{ color: T.muted }}>
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            {open && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 inset-y-0 w-[220px]"
                        style={{ background: "#0a0a0a", borderRight: `1px solid ${T.border}` }}>
                        <Sidebar {...sp} />
                    </div>
                </div>
            )}

            <main className="lg:pl-[220px] min-h-screen">
                <div className="px-8 py-10 lg:px-12 max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
