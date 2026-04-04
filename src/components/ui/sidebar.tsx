import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Blocks,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  UserCircle,
  UserCog,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/Badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const sidebarVariants = {
  open: { width: "15rem" },
  closed: { width: "3.05rem" },
}

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
}

const itemVariants = {
  open: {
    x: 0,
    opacity: 1,
    transition: { x: { stiffness: 1000, velocity: -100 } },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: { x: { stiffness: 100 } },
  },
}

const transitionProps = {
  type: "tween" as const,
  ease: "easeOut" as const,
  duration: 0.2,
  staggerChildren: 0.1,
}

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
}

type SidebarItem = {
  label: string
  to: string
  icon: LucideIcon
  badge?: string
}

type SidebarMenuItem = {
  label: string
  to?: string
  icon: LucideIcon
  onSelect?: () => void
}

type PortalSidebarProps = {
  pathname: string
  items: SidebarItem[]
  organizationName: string
  accountName: string
  accountEmail: string
  accountInitials: string
  onSignOut: () => void
  bottomActionLabel?: string
  bottomActionTo?: string
  accent?: "admin" | "owner"
  collapsedByDefault?: boolean
  hoverExpand?: boolean
  className?: string
}

function isActivePath(pathname: string, to: string) {
  if (to === "/admin" || to === "/owner") {
    return pathname === to || pathname === `${to}/`
  }
  return pathname.startsWith(to)
}

function getAccentClasses(accent: "admin" | "owner") {
  if (accent === "admin") {
    return {
      active: "bg-[rgba(184,92,53,0.10)] text-[#f5ede7]",
      activeIcon: "text-[#b85c35]",
      badge: "bg-[rgba(184,92,53,0.12)] text-[#b85c35] border-[rgba(184,92,53,0.25)]",
      beta: "bg-[rgba(184,92,53,0.12)] text-[#d17a51]",
    }
  }

  return {
    active: "bg-[rgba(200,160,52,0.10)] text-[#f5ede7]",
    activeIcon: "text-[#c8a034]",
    badge: "bg-[rgba(200,160,52,0.12)] text-[#c8a034] border-[rgba(200,160,52,0.25)]",
    beta: "bg-[rgba(200,160,52,0.12)] text-[#dcc16a]",
  }
}

export function SessionNavBar({
  pathname,
  items,
  organizationName,
  accountName,
  accountEmail,
  accountInitials,
  onSignOut,
  bottomActionLabel,
  bottomActionTo,
  accent = "owner",
  collapsedByDefault = true,
  hoverExpand = true,
  className,
}: PortalSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(collapsedByDefault)
  const navigate = useNavigate()
  const accentClasses = getAccentClasses(accent)

  const organizationItems = useMemo<SidebarMenuItem[]>(() => {
    return accent === "admin"
      ? [
          { label: "Manage owners", to: "/admin/owners", icon: UserCog },
          { label: "System health", to: "/admin/health", icon: Blocks },
          { label: "Create owner flow", to: "/signup", icon: Plus },
        ]
      : [
          { label: "Dashboard", to: "/owner", icon: LayoutDashboard },
          { label: "Settings", to: "/owner/settings", icon: Settings },
          { label: "Create another workspace", to: "/signup", icon: Plus },
        ]
  }, [accent])

  const accountItems = useMemo<SidebarMenuItem[]>(() => {
    return accent === "admin"
      ? [
          { label: "Admin overview", to: "/admin", icon: LayoutDashboard },
          { label: "All owners", to: "/admin/owners", icon: UserCircle },
          { label: "Sign out", icon: LogOut, onSelect: onSignOut },
        ]
      : [
          { label: "Owner dashboard", to: "/owner", icon: LayoutDashboard },
          { label: "Sign out", icon: LogOut, onSelect: onSignOut },
        ]
  }, [accent, onSignOut])

  const handleBottomSignOut = async () => {
    await onSignOut()
    navigate("/login")
  }

  const collapsible = hoverExpand

  return (
    <motion.div
      className={cn("fixed left-0 z-40 h-full shrink-0 border-r border-[rgba(232,228,221,0.07)]", className)}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => collapsible && setIsCollapsed(false)}
      onMouseLeave={() => collapsible && setIsCollapsed(true)}
    >
      <motion.div
        className="relative z-40 flex h-full shrink-0 flex-col bg-[#0a0a0a] text-muted-foreground transition-all"
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0 border-b border-[rgba(232,228,221,0.07)] p-2">
              <div className="mt-[1.5px] flex w-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex w-full items-center justify-start gap-2 px-2 text-[#e8e4dd] hover:bg-[rgba(232,228,221,0.04)] hover:text-[#f7f3ee]"
                    >
                      <Avatar className="rounded size-4">
                        <AvatarFallback className={cn("text-[10px] font-semibold", accentClasses.badge)}>
                          {accountInitials}
                        </AvatarFallback>
                      </Avatar>
                      <motion.li
                        variants={itemVariants}
                        className="flex w-fit items-center gap-2 list-none"
                      >
                        {!isCollapsed && (
                          <>
                            <p className="max-w-[10rem] truncate text-sm font-medium">
                              {organizationName}
                            </p>
                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                          </>
                        )}
                      </motion.li>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {organizationItems.map((item) => (
                      <DropdownMenuItem
                        key={item.label}
                        onSelect={item.onSelect}
                        asChild={Boolean(item.to)}
                        className="flex items-center gap-2"
                      >
                        {item.to ? (
                          <Link to={item.to}>
                            <item.icon className="h-4 w-4" /> {item.label}
                          </Link>
                        ) : (
                          <button type="button" className="flex w-full items-center gap-2">
                            <item.icon className="h-4 w-4" /> {item.label}
                          </button>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className="flex w-full flex-col gap-1">
                    {items.length === 0 ? (
                      <div className="space-y-2 px-1">
                        <Skeleton className="h-8 w-full bg-[rgba(232,228,221,0.08)]" />
                        <Skeleton className="h-8 w-full bg-[rgba(232,228,221,0.06)]" />
                      </div>
                    ) : (
                      items.map((item, index) => {
                        const active = isActivePath(pathname, item.to)

                        return (
                          <div key={item.label}>
                            {index === 0 ? null : undefined}
                            <Link
                              to={item.to}
                              className={cn(
                                "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-[rgba(232,228,221,0.05)] hover:text-[#f7f3ee]",
                                active && accentClasses.active,
                              )}
                            >
                              <item.icon className={cn("h-4 w-4 shrink-0", active ? accentClasses.activeIcon : "text-[rgba(232,228,221,0.58)]")} />
                              <motion.li variants={itemVariants} className="list-none">
                                {!isCollapsed && (
                                  <div className="ml-2 flex items-center gap-2">
                                    <p className="text-sm font-medium">{item.label}</p>
                                    {item.badge ? (
                                      <Badge className={cn("h-fit rounded border-none px-1.5 py-0 text-[10px]", accentClasses.beta)} variant="outline">
                                        {item.badge}
                                      </Badge>
                                    ) : null}
                                  </div>
                                )}
                              </motion.li>
                            </Link>
                            {index === 0 || index === items.length - 2 ? (
                              <Separator className="my-1 bg-[rgba(232,228,221,0.07)]" />
                            ) : null}
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
              <div className="mt-auto flex flex-col p-2">
                {bottomActionLabel && bottomActionTo ? (
                  <Link
                    to={bottomActionTo}
                    className="flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 text-[rgba(232,228,221,0.78)] transition hover:bg-[rgba(232,228,221,0.05)] hover:text-[#f7f3ee]"
                  >
                    <Settings className="h-4 w-4 shrink-0 text-[rgba(232,228,221,0.72)]" />
                    <motion.li variants={itemVariants} className="list-none">
                      {!isCollapsed && (
                        <p className="ml-2 text-sm font-medium">
                          {bottomActionLabel}
                        </p>
                      )}
                    </motion.li>
                  </Link>
                ) : null}

                <button
                  type="button"
                  onClick={handleBottomSignOut}
                  className="mt-1 flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 text-[rgba(232,228,221,0.82)] transition hover:bg-[rgba(232,228,221,0.05)] hover:text-[#f7f3ee]"
                >
                  <LogOut className="h-4 w-4 shrink-0 text-[rgba(232,228,221,0.72)]" />
                  <motion.li variants={itemVariants} className="list-none">
                    {!isCollapsed && (
                      <p className="ml-2 text-sm font-medium">Sign out</p>
                    )}
                  </motion.li>
                </button>

                <div className="mt-2 rounded-xl border border-[rgba(232,228,221,0.16)] bg-[rgba(255,255,255,0.02)] p-1">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full">
                      <div className="flex h-14 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 text-[#e8e4dd] transition hover:bg-[rgba(232,228,221,0.05)] hover:text-[#f7f3ee]">
                        <Avatar className="size-4">
                          <AvatarFallback className={cn("text-[10px] font-semibold", accentClasses.badge)}>
                            {accountInitials}
                          </AvatarFallback>
                        </Avatar>
                        <motion.li
                          variants={itemVariants}
                          className="flex w-full items-center gap-2 list-none"
                        >
                          {!isCollapsed && (
                            <>
                              <div className="min-w-0 text-left">
                                <p className="truncate text-sm font-medium text-[#f5ede7]">{accountName}</p>
                                <p className="truncate text-xs text-[rgba(232,228,221,0.58)]">{accountEmail}</p>
                              </div>
                              <ChevronsUpDown className="ml-auto h-4 w-4 text-muted-foreground/50" />
                            </>
                          )}
                        </motion.li>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5} className="border-[rgba(232,228,221,0.12)] bg-[#111] text-[#f5ede7]">
                      <div className="flex flex-row items-center gap-2 p-2">
                        <Avatar className="size-6">
                          <AvatarFallback className={cn("text-[10px] font-semibold", accentClasses.badge)}>
                            {accountInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium text-[#f5ede7]">
                            {accountName}
                          </span>
                          <span className="line-clamp-1 text-xs text-[rgba(232,228,221,0.58)]">
                            {accountEmail}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      {accountItems.map((item) => (
                        <DropdownMenuItem
                          key={item.label}
                          onSelect={item.onSelect}
                          asChild={Boolean(item.to)}
                          className="flex items-center gap-2"
                        >
                          {item.to ? (
                            <Link to={item.to}>
                              <item.icon className="h-4 w-4" /> {item.label}
                            </Link>
                          ) : (
                            <button type="button" className="flex w-full items-center gap-2">
                              <item.icon className="h-4 w-4" /> {item.label}
                            </button>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  )
}
