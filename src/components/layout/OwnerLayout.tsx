import { Outlet, useLocation } from "react-router-dom"
import { useState } from "react"
import { BarChart3, Calendar, LayoutDashboard, Menu, PhoneCall, TableProperties, X } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useBusinessData } from "@/hooks/useBusinessData"
import { SessionNavBar } from "@/components/ui/sidebar"

const D = "'Syne', sans-serif"
const T = {
    text: "#e8e4dd",
    muted: "rgba(232,228,221,0.38)",
    border: "rgba(232,228,221,0.07)",
}

const navItems = [
    { label: "Dashboard", to: "/owner", icon: LayoutDashboard },
    { label: "Call History", to: "/owner/calls", icon: PhoneCall },
    { label: "Appointments", to: "/owner/appointments", icon: Calendar },
    { label: "Sheet Records", to: "/owner/sheet-records", icon: TableProperties },
    { label: "Analytics", to: "/owner/analytics", icon: BarChart3 },
]

function getInitials(name?: string | null, fallback = "O") {
    if (!name) return fallback
    const parts = name.trim().split(/\s+/).slice(0, 2)
    return parts.map((part) => part[0]?.toUpperCase()).join("") || fallback
}

export function OwnerLayout() {
    const { signOut, profile, user } = useAuth()
    const { business } = useBusinessData()
    const { pathname } = useLocation()
    const [open, setOpen] = useState(false)

    const accountName = profile?.full_name || "Owner"
    const accountEmail = profile?.email || user?.email || "owner@awaaz.ai"
    const organizationName = business?.name || "Business name"

    return (
        <div
            className="min-h-screen"
            style={{
                background: "#080808",
                fontFamily: "'Inter', sans-serif",
                zoom: "1.25",
                width: "80%",
                minWidth: "100%",
            }}
        >
            <div className="hidden lg:block">
                <SessionNavBar
                    pathname={pathname}
                    items={navItems}
                    organizationName={organizationName}
                    accountName={accountName}
                    accountEmail={accountEmail}
                    accountInitials={getInitials(accountName)}
                    onSignOut={signOut}
                    bottomActionLabel="Settings"
                    bottomActionTo="/owner/settings"
                    accent="owner"
                />
            </div>

            <header className="lg:hidden flex h-14 items-center justify-between px-5 border-b"
                style={{ background: "#0a0a0a", borderColor: T.border }}>
                <div className="flex flex-col" style={{ color: T.text }}>
                    <span style={{ fontFamily: D, fontWeight: 700, fontSize: "16px" }}>{organizationName}</span>
                    <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: T.muted }}>Owner Portal</span>
                </div>
                <button onClick={() => setOpen(!open)} style={{ color: T.muted }}>
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            {open && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <SessionNavBar
                        pathname={pathname}
                        items={navItems}
                        organizationName={organizationName}
                        accountName={accountName}
                        accountEmail={accountEmail}
                        accountInitials={getInitials(accountName)}
                        onSignOut={async () => {
                            setOpen(false)
                            await signOut()
                        }}
                        bottomActionLabel="Settings"
                        bottomActionTo="/owner/settings"
                        accent="owner"
                        collapsedByDefault={false}
                        hoverExpand={false}
                        className="!static !left-auto"
                    />
                </div>
            )}

            <main className="lg:pl-[240px] min-h-screen">
                <div className="px-8 py-10 lg:px-12 max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
