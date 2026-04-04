import { useMemo, useState } from "react"
import { useBusinessData } from "@/hooks/useBusinessData"
import { useAppointmentsData } from "@/hooks/useAppointmentsData"
import type { Appointment } from "@/types/database"
import { format, parseISO, addDays, addMonths, subMonths, startOfMonth, startOfWeek, isSameDay, isSameMonth, isToday } from "date-fns"
import { LayoutList, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, PhoneCall, Clock3 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const D = "'Syne', sans-serif"
const I = "'Inter', sans-serif"
const T = {
    text: "#e8e4dd", muted: "rgba(232,228,221,0.38)", ghost: "rgba(232,228,221,0.1)",
    border: "rgba(232,228,221,0.07)", borderStrong: "rgba(232,228,221,0.12)",
    gold: "#c8a034", goldBg: "rgba(200,160,52,0.07)", surface: "#0d0d0d",
    blue: "#4a7fa5", blueBg: "rgba(74,127,165,0.1)",
}

const STATUS: Record<Appointment["status"], { label: string; color: string; bg: string }> = {
    confirmed: { label: "Confirmed", color: "#4aaa78", bg: "rgba(74,170,120,0.1)" },
    pending: { label: "Pending", color: "#c8a034", bg: "rgba(200,160,52,0.08)" },
    completed: { label: "Completed", color: "#4a7fa5", bg: "rgba(74,127,165,0.1)" },
    cancelled: { label: "Cancelled", color: "#b85c35", bg: "rgba(184,92,53,0.1)" },
    "no-show": { label: "No Show", color: "rgba(232,228,221,0.3)", bg: "rgba(232,228,221,0.05)" },
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function getAppointmentSource(appointment: Appointment) {
    if (appointment.call_id) {
        return { label: "Phone call", color: T.gold, bg: T.goldBg, icon: PhoneCall }
    }

    return { label: "Manual", color: T.blue, bg: T.blueBg, icon: Clock3 }
}

export default function Appointments() {
    const { business } = useBusinessData()
    const { appointments, todayCount, upcomingCount, loading } = useAppointmentsData(business?.id)
    const [view, setView] = useState<"list" | "calendar">("list")
    const [filter, setFilter] = useState("all")
    const [monthCursor, setMonthCursor] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())

    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekCount = appointments.filter(a => {
        const d = parseISO(a.appointment_date)
        return d >= weekStart && d < addDays(weekStart, 7) && a.status === "confirmed"
    }).length

    const filtered = appointments.filter(a => filter === "all" || a.status === filter)

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(monthCursor)
        const firstVisible = startOfWeek(monthStart)
        return Array.from({ length: 42 }, (_, i) => addDays(firstVisible, i))
    }, [monthCursor])

    const selectedDayAppointments = useMemo(() => {
        return filtered.filter(appointment => isSameDay(parseISO(appointment.appointment_date), selectedDate))
    }, [filtered, selectedDate])

    const update = async (id: string, status: string) => {
        const { error } = await supabase.from("appointments").update({ status }).eq("id", id)
        error ? toast.error("Failed to update") : toast.success(`Marked ${status}`)
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-5 h-5 rounded-full border border-t-[#c8a034] border-[rgba(232,228,221,0.08)] animate-spin" />
        </div>
    )

    const CalendarView = () => (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.5fr)_380px] gap-6">
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border, background: T.surface }}>
                <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: T.border }}>
                    <div style={{ fontFamily: D, fontWeight: 600, color: T.text }}>{format(monthCursor, "MMMM yyyy")}</div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setMonthCursor(subMonths(monthCursor, 1))}
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                            style={{ border: `1px solid ${T.border}`, color: T.muted }}>
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => { setMonthCursor(new Date()); setSelectedDate(new Date()) }}
                            className="px-3 py-2 rounded-lg text-[12px] transition-all"
                            style={{ border: `1px solid ${T.border}`, color: T.muted }}>
                            Today
                        </button>
                        <button type="button" onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
                            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                            style={{ border: `1px solid ${T.border}`, color: T.muted }}>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-7 border-b" style={{ borderColor: T.border }}>
                    {DAYS.map(d => (
                        <div key={d} className="py-3 text-center text-[10px] uppercase tracking-wider border-r last:border-0"
                            style={{ borderColor: T.border, color: T.muted }}>{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {calendarDays.map(day => {
                        const dayAppointments = filtered.filter(a => isSameDay(parseISO(a.appointment_date), day))
                        const inCurrentMonth = isSameMonth(day, monthCursor)
                        const dayIsToday = isToday(day)
                        const isSelected = isSameDay(day, selectedDate)
                        return (
                            <button key={day.toISOString()} type="button" onClick={() => setSelectedDate(day)}
                                className="min-h-[110px] p-2 border-r border-b last:border-r-0 text-left transition-all"
                                style={{
                                    borderColor: T.border,
                                    background: isSelected ? "rgba(200,160,52,0.08)" : dayIsToday ? "rgba(232,228,221,0.02)" : undefined,
                                    opacity: inCurrentMonth ? 1 : 0.42,
                                }}>
                                <span className={cn("text-[12px] font-medium w-7 h-7 flex items-center justify-center rounded-full mb-2")}
                                    style={{ background: isSelected || dayIsToday ? T.gold : "transparent", color: isSelected || dayIsToday ? "#000" : T.muted }}>
                                    {format(day, "d")}
                                </span>
                                <div className="space-y-1">
                                    {dayAppointments.slice(0, 2).map(a => (
                                        <div key={a.id} className="text-[10px] px-2 py-1 rounded truncate"
                                            style={{ background: a.call_id ? T.goldBg : T.blueBg, color: a.call_id ? T.gold : T.blue }}>
                                            {a.appointment_time.slice(0, 5)} {a.customer_name}
                                        </div>
                                    ))}
                                    {dayAppointments.length > 2 ? <div className="text-[10px]" style={{ color: T.muted }}>+{dayAppointments.length - 2} more</div> : null}
                                    {dayAppointments.length === 0 ? <div className="text-[10px]" style={{ color: "rgba(232,228,221,0.18)" }}>No bookings</div> : null}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
            <div className="rounded-xl border overflow-hidden h-fit" style={{ borderColor: T.border, background: T.surface }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: T.border }}>
                    <div style={{ fontFamily: D, fontWeight: 600, color: T.text }}>{format(selectedDate, "EEEE, MMMM d")}</div>
                    <div className="text-[12px] mt-1" style={{ color: T.muted }}>
                        {selectedDayAppointments.length} appointment{selectedDayAppointments.length === 1 ? "" : "s"}
                    </div>
                </div>
                <div className="p-4 space-y-3">
                    {selectedDayAppointments.length === 0 ? (
                        <div className="rounded-xl border px-4 py-8 text-center" style={{ borderColor: T.border, color: T.muted }}>
                            No appointments on this day.
                        </div>
                    ) : selectedDayAppointments.map(appointment => {
                        const status = STATUS[appointment.status]
                        const source = getAppointmentSource(appointment)
                        const SourceIcon = source.icon
                        return (
                            <div key={appointment.id} className="rounded-xl border px-4 py-4" style={{ borderColor: T.border }}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[14px] font-medium" style={{ color: T.text }}>{appointment.customer_name}</div>
                                        <div className="text-[12px] mt-1" style={{ color: T.muted }}>{appointment.customer_phone}</div>
                                    </div>
                                    <span className="text-[11px] font-medium px-2 py-1 rounded-md" style={{ color: status.color, background: status.bg }}>
                                        {status.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    <span className="text-[11px] px-2 py-1 rounded-md" style={{ color: T.text, background: "rgba(232,228,221,0.06)" }}>
                                        {appointment.appointment_time.slice(0, 5)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md" style={{ color: source.color, background: source.bg }}>
                                        <SourceIcon className="w-3 h-3" />
                                        {source.label}
                                    </span>
                                </div>
                                {appointment.reason ? <div className="mt-3 text-[12px]" style={{ color: T.muted }}>Reason: {appointment.reason}</div> : null}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )

    return (
        <div style={{ fontFamily: I }}>
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: T.muted }}>Owner portal</p>
                    <h1 style={{ fontFamily: D, fontWeight: 700, fontSize: "clamp(1.8rem,3vw,2.6rem)", color: T.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                        Appointments
                    </h1>
                </div>
                <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: T.border }}>
                    {[{ v: "list", icon: LayoutList }, { v: "calendar", icon: CalendarDays }].map(({ v, icon: Icon }) => (
                        <button key={v} onClick={() => setView(v as any)}
                            className="px-4 py-2.5 transition-all"
                            style={{ background: view === v ? "rgba(200,160,52,0.08)" : "transparent", color: view === v ? T.gold : T.muted }}>
                            <Icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary strip */}
            <div className="flex divide-x rounded-xl border mb-8 overflow-hidden"
                style={{ borderColor: T.border, background: T.surface }}>
                {[
                    { label: "Today", value: todayCount },
                    { label: "This week", value: weekCount },
                    { label: "Upcoming", value: upcomingCount },
                    { label: "Total", value: appointments.length },
                ].map((s, i) => (
                    <div key={i} className="flex-1 px-6 py-5">
                        <div style={{ fontFamily: D, fontWeight: 700, fontSize: "2rem", color: T.text, letterSpacing: "-0.04em", lineHeight: 1 }}>
                            {s.value}
                        </div>
                        <div className="mt-2 text-[11px] uppercase tracking-[0.15em]" style={{ color: T.muted }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5 mb-5 flex-wrap">
                {["all", ...Object.keys(STATUS)].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all capitalize"
                        style={{
                            background: filter === s ? (s === "all" ? "rgba(232,228,221,0.08)" : STATUS[s as keyof typeof STATUS]?.bg) : "transparent",
                            color: filter === s ? (s === "all" ? T.text : STATUS[s as keyof typeof STATUS]?.color) : T.muted,
                            border: `1px solid ${filter === s ? "rgba(232,228,221,0.15)" : T.border}`,
                            fontFamily: I
                        }}>
                        {s === "all" ? "All" : STATUS[s as keyof typeof STATUS].label}
                    </button>
                ))}
            </div>

            {view === "calendar" ? <CalendarView /> : (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border }}>
                    <div className="grid text-[10px] uppercase tracking-[0.18em] px-5 py-3 border-b"
                        style={{ gridTemplateColumns: "1.1fr 90px 70px 120px 150px 140px", background: T.surface, borderColor: T.border, color: T.muted }}>
                        <span>Customer</span><span>Date</span><span>Time</span><span>Source</span><span>Status</span><span>Update</span>
                    </div>
                    {filtered.length === 0 ? (
                        <div className="py-20 text-center" style={{ background: "#0a0a0a" }}>
                            <p className="text-[14px]" style={{ color: T.muted }}>No appointments.</p>
                        </div>
                    ) : filtered.map((apt, idx) => {
                        const ss = STATUS[apt.status]
                        const source = getAppointmentSource(apt)
                        const SourceIcon = source.icon
                        return (
                            <div key={apt.id}
                                className="grid px-5 py-4 border-b"
                                style={{ gridTemplateColumns: "1.1fr 90px 70px 120px 150px 140px", background: idx % 2 === 0 ? "#0a0a0a" : "#090909", borderColor: T.border }}>
                                <div>
                                    <div className="text-[14px] font-medium" style={{ color: T.text }}>{apt.customer_name}</div>
                                    <div className="text-[12px]" style={{ color: T.muted }}>{apt.customer_phone}</div>
                                    {apt.reason ? <div className="text-[11px] mt-1" style={{ color: "rgba(232,228,221,0.28)" }}>{apt.reason}</div> : null}
                                </div>
                                <div className="text-[13px] self-center" style={{ color: T.muted }}>
                                    {format(parseISO(apt.appointment_date), "MMM d")}
                                </div>
                                <div className="text-[13px] font-mono self-center" style={{ color: T.muted }}>
                                    {apt.appointment_time.slice(0, 5)}
                                </div>
                                <div className="self-center">
                                    <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md"
                                        style={{ color: source.color, background: source.bg }}>
                                        <SourceIcon className="w-3 h-3" />
                                        {source.label}
                                    </span>
                                </div>
                                <div className="self-center">
                                    <span className="text-[11px] font-medium px-2 py-1 rounded-md"
                                        style={{ color: ss.color, background: ss.bg }}>{ss.label}</span>
                                </div>
                                <div className="self-center">
                                    <div className="relative inline-flex items-center">
                                        <select onChange={e => update(apt.id, e.target.value)} value={apt.status}
                                            className="appearance-none bg-transparent border rounded-lg pl-3 pr-7 py-1.5 text-[12px] outline-none cursor-pointer transition-all focus:border-[rgba(200,160,52,0.3)]"
                                            style={{ borderColor: T.border, color: T.muted, fontFamily: I }}>
                                            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k} style={{ background: "#111" }}>{v.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: T.muted }} />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
