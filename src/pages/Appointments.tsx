import { useState } from "react"
import { useBusinessData } from "@/hooks/useBusinessData"
import { useAppointmentsData } from "@/hooks/useAppointmentsData"
import type { Appointment } from "@/types/database"
import { format, parseISO, addDays, getDaysInMonth, startOfMonth, startOfWeek, isSameDay } from "date-fns"
import { Calendar, Clock, Phone, User, LayoutList, CalendarDays } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const C = {
  gold: "#c9a227", goldLight: "rgba(201,162,39,0.1)", goldBorder: "rgba(201,162,39,0.18)",
  terra: "#c4643a",
  text: "#f0ede8", textMuted: "rgba(240,237,232,0.4)", textGhost: "rgba(240,237,232,0.1)",
  surface: "#0f0f0f", elevated: "#141414", border: "rgba(255,255,255,0.06)",
}

const STATUS_STYLES: Record<Appointment["status"], { label: string; color: string; bg: string }> = {
  confirmed: { label: "Confirmed", color: "#5c9e6e", bg: "rgba(92,158,110,0.12)" },
  pending: { label: "Pending", color: "#c9a227", bg: "rgba(201,162,39,0.1)" },
  completed: { label: "Completed", color: "#4a7fa5", bg: "rgba(74,127,165,0.1)" },
  cancelled: { label: "Cancelled", color: "#c4643a", bg: "rgba(196,100,58,0.1)" },
  "no-show": { label: "No Show", color: "rgba(240,237,232,0.3)", bg: "rgba(255,255,255,0.05)" },
}

export default function Appointments() {
  const { business } = useBusinessData()
  const { appointments, todayCount, upcomingCount, loading } = useAppointmentsData(business?.id)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [statusFilter, setStatusFilter] = useState("all")

  const weekStart = startOfWeek(new Date())
  const thisWeekCount = appointments.filter(a => {
    const d = parseISO(a.appointment_date)
    return d >= weekStart && d < addDays(weekStart, 7) && a.status === "confirmed"
  }).length

  const filtered = appointments.filter(a => statusFilter === "all" || a.status === statusFilter)

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", id)
    error ? toast.error("Failed to update status") : toast.success(`Marked as ${newStatus}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#c9a227] border-white/10 animate-spin" />
      </div>
    )
  }

  const CalendarGrid = () => {
    const now = new Date()
    const start = startOfMonth(now)
    const total = getDaysInMonth(now)
    const blanks = start.getDay()
    const days = Array.from({ length: total }, (_, i) => addDays(start, i))
    const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
    return (
      <div className="rounded-2xl border overflow-hidden" style={{ background: C.surface, borderColor: C.border }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: C.border }}>
          <h3 className="text-[16px] font-semibold" style={{ color: C.text }}>{format(now, "MMMM yyyy")}</h3>
        </div>
        <div className="grid grid-cols-7 border-b" style={{ borderColor: C.border }}>
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center text-[11px] font-medium uppercase tracking-wider border-r last:border-0"
              style={{ borderColor: C.border, color: C.textMuted }}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: blanks }).map((_, i) => <div key={`b${i}`} className="py-8 border-r border-b" style={{ borderColor: C.border }} />)}
          {days.map(day => {
            const dayApts = appointments.filter(a => isSameDay(parseISO(a.appointment_date), day) && a.status === "confirmed")
            const isToday = isSameDay(day, now)
            return (
              <div key={day.toISOString()} className="min-h-[64px] p-2 border-r border-b last:border-r-0 relative"
                style={{ borderColor: C.border, background: isToday ? "rgba(201,162,39,0.05)" : undefined }}>
                <span className={cn("text-[12px] font-medium w-6 h-6 flex items-center justify-center rounded-full",
                  isToday ? "bg-[#c9a227] text-black" : "")} style={{ color: isToday ? undefined : C.textMuted }}>
                  {format(day, "d")}
                </span>
                {dayApts.map(a => (
                  <div key={a.id} className="mt-1 px-1.5 py-0.5 rounded-md text-[10px] truncate font-medium"
                    style={{ background: "rgba(201,162,39,0.15)", color: C.gold }}>
                    {a.customer_name}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] tracking-[0.25em] uppercase mb-2" style={{ color: C.textMuted }}>Owner Portal</p>
          <h1 className="text-[2.2rem] leading-tight" style={{ fontFamily: "'Instrument Serif', serif", color: C.text }}>
            Appointments
          </h1>
          <p className="text-[14px] mt-1" style={{ color: C.textMuted }}>Track and manage every booking made by your AI agent.</p>
        </div>
        {/* View toggle */}
        <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
          {[{ mode: "list", icon: LayoutList }, { mode: "calendar", icon: CalendarDays }].map(({ mode, icon: Icon }) => (
            <button key={mode} onClick={() => setViewMode(mode as any)}
              className="px-4 py-2.5 transition-all"
              style={{ background: viewMode === mode ? C.goldLight : "transparent", color: viewMode === mode ? C.gold : C.textMuted }}>
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Today", value: todayCount, icon: Calendar },
          { label: "This Week", value: thisWeekCount, icon: CalendarDays },
          { label: "Upcoming", value: upcomingCount, icon: Clock },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border p-5" style={{ background: C.surface, borderColor: C.border }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-4" style={{ background: C.goldLight }}>
              <item.icon className="w-4 h-4" style={{ color: C.gold }} />
            </div>
            <div className="text-[1.8rem] font-bold" style={{ color: C.text }}>{item.value}</div>
            <div className="text-[12px]" style={{ color: C.textMuted }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-transparent border rounded-xl px-3 py-2 text-[13px] outline-none transition-all focus:border-[rgba(201,162,39,0.4)]"
          style={{ borderColor: C.border, color: C.text }}>
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {viewMode === "calendar" ? <CalendarGrid /> : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.border }}>
          {/* Table header */}
          <div className="grid grid-cols-[1fr_100px_80px_110px_130px] px-5 py-3 border-b text-[11px] font-medium uppercase tracking-[0.15em]"
            style={{ background: C.elevated, borderColor: C.border, color: C.textMuted }}>
            <span>Customer</span><span>Date</span><span>Time</span><span>Status</span><span>Update</span>
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20" style={{ background: C.surface }}>
              <Calendar className="w-8 h-8 mb-4 opacity-20" style={{ color: C.text }} />
              <p className="text-[14px]" style={{ color: C.textMuted }}>No appointments found.</p>
            </div>
          ) : (
            filtered.map((apt, idx) => {
              const ss = STATUS_STYLES[apt.status]
              return (
                <div key={apt.id}
                  className="grid grid-cols-[1fr_100px_80px_110px_130px] px-5 py-4 border-b transition-colors"
                  style={{ background: idx % 2 === 0 ? C.surface : "rgba(255,255,255,0.01)", borderColor: C.border }}>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <User className="w-3 h-3 opacity-40" style={{ color: C.text }} />
                      <span className="text-[13px] font-medium" style={{ color: C.text }}>{apt.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 opacity-30" style={{ color: C.text }} />
                      <span className="text-[11px]" style={{ color: C.textMuted }}>{apt.customer_phone}</span>
                    </div>
                  </div>
                  <span className="text-[12px]" style={{ color: C.textMuted }}>{format(parseISO(apt.appointment_date), "MMM dd")}</span>
                  <span className="text-[12px] font-mono" style={{ color: C.textMuted }}>{apt.appointment_time.slice(0, 5)}</span>
                  <span>
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ color: ss.color, background: ss.bg }}>{ss.label}</span>
                  </span>
                  <select onChange={e => handleStatusUpdate(apt.id, e.target.value)} value={apt.status}
                    className="bg-transparent border rounded-lg px-2 py-1 text-[11px] outline-none cursor-pointer"
                    style={{ borderColor: C.border, color: C.textMuted }}>
                    {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
