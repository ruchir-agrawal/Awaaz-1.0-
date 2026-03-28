import { Outlet, Link, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import {
    LayoutDashboard,
    PhoneCall,
    Calendar,
    Settings,
    BarChart3,
    LogOut,
    Menu,
    X,
} from "lucide-react"
import { useState } from "react"
import { useBusinessData } from "@/hooks/useBusinessData"
import { cn } from "@/lib/utils"

// Jaali-inspired mandala decorator
function MandalaDecor({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 120 120" className={className} fill="none">
            <circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
            <circle cx="60" cy="60" r="44" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <circle cx="60" cy="60" r="28" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            <circle cx="60" cy="60" r="10" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
            {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 45 * Math.PI) / 180
                const x1 = 60 + Math.cos(angle) * 12, y1 = 60 + Math.sin(angle) * 12
                const x2 = 60 + Math.cos(angle) * 57, y2 = 60 + Math.sin(angle) * 57
                const mx = 60 + Math.cos(angle + Math.PI / 8) * 38
                const my = 60 + Math.sin(angle + Math.PI / 8) * 38
                return <path key={i} d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
            })}
            {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 45 * Math.PI) / 180
                const x = 60 + Math.cos(angle) * 44, y = 60 + Math.sin(angle) * 44
                return <rect key={i} x={x - 2} y={y - 2} width="4" height="4" fill="currentColor" transform={`rotate(45 ${x} ${y})`} opacity="0.5" />
            })}
        </svg>
    )
}

const navigation = [
    { name: "Dashboard", href: "/owner", icon: LayoutDashboard },
    { name: "Call History", href: "/owner/calls", icon: PhoneCall },
    { name: "Appointments", href: "/owner/appointments", icon: Calendar },
    { name: "Analytics", href: "/owner/analytics", icon: BarChart3 },
    { name: "Settings", href: "/owner/settings", icon: Settings },
]

function SidebarContent({ onClose, business, signOut, location }: any) {
    return (
        <div className="flex flex-col h-full" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {/* Brand */}
            <div className="px-6 pt-8 pb-6 flex items-center gap-3">
                <MandalaDecor className="w-7 h-7 text-amber-500/70" />
                <span className="text-[22px] text-[#f0ede8] leading-none"
                    style={{ fontFamily: "'Instrument Serif', serif" }}>
                    Awaaz
                </span>
            </div>

            {/* Business info */}
            {business && (
                <div className="px-6 pb-6 border-b border-white/5">
                    <div className="text-[12px] text-[rgba(240,237,232,0.35)] uppercase tracking-[0.2em] mb-1">
                        Business
                    </div>
                    <div className="text-[14px] text-[#f0ede8] font-medium truncate">{business.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[11px] text-[rgba(240,237,232,0.35)]">Agent Active</span>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 px-3 py-6 space-y-1">
                {navigation.map(item => {
                    const isActive = location.pathname === item.href ||
                        (location.pathname === "/owner/" && item.href === "/owner")
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                                isActive
                                    ? "bg-[rgba(201,162,39,0.12)] text-[#e8c547] border border-[rgba(201,162,39,0.2)]"
                                    : "text-[rgba(240,237,232,0.4)] hover:text-[#f0ede8] hover:bg-white/5"
                            )}
                        >
                            <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[#c9a227]" : "opacity-60")} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom decorative mandala + sign out */}
            <div className="px-6 pb-8">
                <div className="relative h-px bg-white/5 mb-6">
                    <MandalaDecor className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 text-[rgba(201,162,39,0.3)]" />
                </div>

                <button
                    onClick={signOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-[rgba(240,237,232,0.3)] hover:text-[rgba(240,237,232,0.7)] hover:bg-white/5 transition-all"
                >
                    <LogOut className="w-4 h-4 opacity-60" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}

export function OwnerLayout() {
    const { signOut } = useAuth()
    const { business } = useBusinessData()
    const location = useLocation()
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const sidebarProps = { onClose: () => setIsMobileOpen(false), business, signOut, location }

    return (
        <div className="min-h-screen bg-[#080808]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {/* Desktop sidebar */}
            <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col bg-[#0d0d0d] border-r border-white/5">
                <SidebarContent {...sidebarProps} />
            </aside>

            {/* Mobile top bar */}
            <div className="lg:hidden flex h-14 items-center justify-between px-4 border-b border-white/5 bg-[#0d0d0d]">
                <div className="flex items-center gap-2">
                    <MandalaDecor className="w-5 h-5 text-amber-500/70" />
                    <span className="text-lg text-[#f0ede8]" style={{ fontFamily: "'Instrument Serif', serif" }}>Awaaz</span>
                </div>
                <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="text-[rgba(240,237,232,0.5)] hover:text-[#f0ede8]">
                    {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile drawer */}
            {isMobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
                    <div className="absolute left-0 inset-y-0 w-64 bg-[#0d0d0d] border-r border-white/5">
                        <SidebarContent {...sidebarProps} />
                    </div>
                </div>
            )}

            {/* Main */}
            <main className="lg:pl-64 min-h-screen">
                <div className="px-6 py-8 lg:px-10 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
