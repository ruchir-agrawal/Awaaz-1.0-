import { LayoutDashboard, Settings } from "lucide-react"

import { SessionNavBar } from "@/components/ui/sidebar"

export function SidebarDemo() {
  return (
    <div className="flex h-screen w-screen flex-row bg-[#080808]">
      <SessionNavBar
        pathname="/dashboard"
        organizationName="Organization"
        accountName="Demo User"
        accountEmail="demo@awaaz.ai"
        accountInitials="D"
        onSignOut={() => undefined}
        items={[
          { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
          { label: "Settings", to: "/settings", icon: Settings },
        ]}
      />
      <main className="flex h-screen grow flex-col overflow-auto" />
    </div>
  )
}
