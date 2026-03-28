import { Outlet, Link, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useDemo } from "@/contexts/DemoContext"
import { useLive } from "@/contexts/LiveContext"
import {
    LayoutDashboard,
    PhoneCall,
    Calendar,
    Settings,
    BarChart3,
    Bot,
    LogOut,
    Sparkles,
    Menu,
    X
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function DashboardLayout() {
    const { signOut } = useAuth()
    const { isDemoMode, toggleDemoMode } = useDemo()
    const { status, simulateIncomingCall, simulateBooking } = useLive()
    const location = useLocation()
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    const navigation = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Call History", href: "/calls", icon: PhoneCall },
        { name: "Appointments", href: "/appointments", icon: Calendar },
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
        { name: "Agent Playground", href: "/playground", icon: Bot },
        { name: "Settings", href: "/settings", icon: Settings },
    ]

    const SidebarContent = () => (
        <>
            <div className="flex shrink-0 items-center px-6 py-6 text-2xl font-bold tracking-tight text-primary-600 dark:text-primary-400">
                <Sparkles className="mr-2 h-6 w-6" />
                Awaaz
            </div>
            <nav className="flex flex-1 flex-col px-4 text-sm font-medium">
                <ul className="flex flex-1 flex-col gap-y-2">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href
                        return (
                            <li key={item.name}>
                                <Link
                                    to={item.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={cn(
                                        "group flex gap-x-3 rounded-md p-2 hover:bg-muted hover:text-foreground transition-colors",
                                        isActive
                                            ? "bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "h-5 w-5 shrink-0",
                                            isActive
                                                ? "text-primary-700 dark:text-primary-400"
                                                : "text-muted-foreground group-hover:text-foreground"
                                        )}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
                <div className="mt-auto pb-4">
                    <div className="mb-4 rounded-xl bg-muted p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Demo Mode</span>
                            <button
                                type="button"
                                onClick={toggleDemoMode}
                                className={cn(
                                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2",
                                    isDemoMode ? "bg-primary-600" : "bg-muted-foreground/30"
                                )}
                            >
                                <span
                                    className={cn(
                                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out bg-card",
                                        isDemoMode ? "translate-x-4" : "translate-x-0"
                                    )}
                                />
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isDemoMode ? "Showing mock data" : "Showing real data"}
                        </p>

                        {isDemoMode && (
                            <div className="mt-4 space-y-2 border-t pt-3 border-border/50">
                                <Button variant="outline" size="sm" className="w-full text-xs" onClick={simulateIncomingCall}>
                                    <PhoneCall className="mr-2 h-3 w-3" /> Simulate Call
                                </Button>
                                <Button variant="outline" size="sm" className="w-full text-xs" onClick={simulateBooking}>
                                    <Calendar className="mr-2 h-3 w-3" /> Simulate Booking
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground mb-2">
                        <div className="relative flex h-2 w-2">
                            {status === "connected" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>}
                            <span className={cn("relative inline-flex rounded-full h-2 w-2", {
                                "bg-success-500": status === "connected",
                                "bg-warning-500": status === "reconnecting",
                                "bg-destructive": status === "offline",
                            })}></span>
                        </div>
                        {status === "connected" ? "Realtime Connected" : status === "reconnecting" ? "Reconnecting..." : "Offline"}
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
                        onClick={signOut}
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </Button>
                </div>
            </nav>
        </>
    )

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Mobile nav */}
            <div className="flex h-16 items-center justify-between border-b bg-card px-4 sm:px-6 lg:hidden">
                <div className="flex items-center text-xl font-bold text-primary-600 dark:text-primary-400">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Awaaz
                </div>
                <button
                    type="button"
                    className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                >
                    <span className="sr-only">Open sidebar</span>
                    {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {isMobileOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
                    <div className="relative flex w-full max-w-xs flex-col bg-card pt-5 pb-4">
                        <SidebarContent />
                    </div>
                </div>
            )}

            {/* Desktop nav */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col lg:border-r lg:bg-card">
                <SidebarContent />
            </div>

            <main className="lg:pl-72">
                <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
