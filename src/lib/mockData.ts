import type { Call, Appointment } from "@/types/database"
import { subDays, subHours, subMinutes, formatISO } from "date-fns"

const MOCK_BUSINESS_ID = "00000000-0000-0000-0000-000000000000"

export const getMockCalls = (): Call[] => {
    const now = new Date()

    return [
        {
            id: "call-1",
            business_id: MOCK_BUSINESS_ID,
            customer_phone: "+91-98765-43210",
            duration_seconds: 154,
            outcome: "booked",
            transcript: "Agent: Hello, this is Awaaz Clinic. How can I help you?\nClient: I'd like to book an appointment for tomorrow.",
            recording_url: "#",
            created_at: formatISO(subMinutes(now, 15)),
        },
        {
            id: "call-2",
            business_id: MOCK_BUSINESS_ID,
            customer_phone: "+91-91234-56789",
            duration_seconds: 45,
            outcome: "transferred",
            transcript: "Agent: Welcome to Awaaz Salon. How can I help?\nClient: Can I speak to the manager about a bulk booking?",
            recording_url: "#",
            created_at: formatISO(subHours(now, 2)),
        },
        {
            id: "call-3",
            business_id: MOCK_BUSINESS_ID,
            customer_phone: "+91-99887-76655",
            duration_seconds: 12,
            outcome: "failed",
            transcript: "Agent: Hello... Hello? \nClient: *hangs up*",
            recording_url: "#",
            created_at: formatISO(subHours(now, 5)),
        },
        {
            id: "call-4",
            business_id: MOCK_BUSINESS_ID,
            customer_phone: "+91-95555-44444",
            duration_seconds: 210,
            outcome: "booked",
            transcript: "Agent: Yes, we have availability at 3 PM.\nClient: Perfect, book it for me.",
            recording_url: "#",
            created_at: formatISO(subHours(now, 6)),
        },
        {
            id: "call-5",
            business_id: MOCK_BUSINESS_ID,
            customer_phone: "+91-93333-22222",
            duration_seconds: 85,
            outcome: "booked",
            transcript: "Agent: Let me get that sorted for you. Your appointment is confirmed.",
            recording_url: "#",
            created_at: formatISO(subDays(now, 1)), // Yesterday
        },
    ]
}

export const getMockAppointments = (): Appointment[] => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return [
        {
            id: "apt-1",
            business_id: MOCK_BUSINESS_ID,
            call_id: "call-1",
            customer_name: "Rahul Sharma",
            customer_phone: "+91-98765-43210",
            appointment_date: "2026-03-06",
            appointment_time: "10:00:00",
            reason: "Dental Checkup",
            status: "confirmed",
            created_at: formatISO(new Date()),
        },
        {
            id: "apt-2",
            business_id: MOCK_BUSINESS_ID,
            call_id: "call-4",
            customer_name: "Priya Patel",
            customer_phone: "+91-95555-44444",
            appointment_date: "2026-03-06",
            appointment_time: "15:00:00",
            reason: "Haircut and Spa",
            status: "pending",
            created_at: formatISO(new Date()),
        },
        {
            id: "apt-3",
            business_id: MOCK_BUSINESS_ID,
            call_id: "call-5",
            customer_name: "Amit Kumar",
            customer_phone: "+91-93333-22222",
            appointment_date: "2026-03-07",
            appointment_time: "11:30:00",
            reason: "Consultation",
            status: "confirmed",
            created_at: formatISO(new Date()),
        },
    ]
}

export const getChartData = () => {
    return [
        { name: 'Mon', calls: 40 },
        { name: 'Tue', calls: 30 },
        { name: 'Wed', calls: 45 },
        { name: 'Thu', calls: 50 },
        { name: 'Fri', calls: 65 },
        { name: 'Sat', calls: 80 },
        { name: 'Sun', calls: 20 },
    ]
}
export const getAnalyticsCallVolume = (days: number = 7) => {
    const hours = ["9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM", "5PM"]
    const multiplier = days === 1 ? 1 : days === 7 ? 6 : 25

    return hours.map(hour => ({
        time: hour,
        answered: Math.floor((Math.random() * 5 + 3) * multiplier),
        missed: Math.floor((Math.random() * 2) * multiplier),
    }))
}

export const getAnalyticsConversion = (days: number = 7) => {
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const multiplier = days === 1 ? 1 : days === 7 ? 1 : 4.2

    // For "Today", just return the current mock day or simple stats
    if (days === 1) {
        return [{
            day: "Today",
            inquiries: Math.floor(25 * multiplier),
            booked: Math.floor(18 * multiplier)
        }]
    }

    return weekDays.map(day => {
        const inquiries = Math.floor((Math.random() * 15 + 10) * multiplier)
        const booked = Math.floor(inquiries * (Math.random() * 0.4 + 0.4)) // 40-80% booking rate
        return {
            day,
            inquiries,
            booked
        }
    })
}

export const getAnalyticsOutcomes = () => {
    return [
        { name: 'Successfully Booked', value: 65, color: 'var(--color-success-500)' },
        { name: 'Transferred to Human', value: 25, color: 'var(--color-warning-500)' },
        { name: 'Failed', value: 10, color: 'var(--color-destructive)' },
    ]
}
