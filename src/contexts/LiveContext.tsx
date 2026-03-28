import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Call, Appointment } from "@/types/database"
import { useDemo } from "./DemoContext"
import { getMockCalls, getMockAppointments } from "@/lib/mockData"
import { toast } from "sonner"
import { formatISO } from "date-fns"

export type ConnectionStatus = "connected" | "reconnecting" | "offline"

interface LiveContextType {
    status: ConnectionStatus
    calls: Call[]
    appointments: Appointment[]
    simulateIncomingCall: () => void
    simulateBooking: () => void
}

const LiveContext = createContext<LiveContextType>({
    status: "offline",
    calls: [],
    appointments: [],
    simulateIncomingCall: () => { },
    simulateBooking: () => { },
})

export function LiveProvider({ children }: { children: React.ReactNode }) {
    const { isDemoMode } = useDemo()
    const [status, setStatus] = useState<ConnectionStatus>("offline")
    const [calls, setCalls] = useState<Call[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])

    // Hydrate initial data
    useEffect(() => {
        async function loadData() {
            if (isDemoMode) {
                setCalls(getMockCalls())
                setAppointments(getMockAppointments())
                // In demo mode, we simulate a connected state
                setTimeout(() => setStatus("connected"), 800)
            } else {
                // Fetch from Supabase
                const { data: callsData } = await supabase
                    .from("calls")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(50)

                const { data: aptData } = await supabase
                    .from("appointments")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(50)

                if (callsData) setCalls(callsData)
                if (aptData) setAppointments(aptData)
            }
        }
        loadData()
    }, [isDemoMode])

    // Setup Real-Time Subscriptions
    useEffect(() => {
        if (isDemoMode) {
            // Cleanup any real-time channels if switching to demo
            supabase.removeAllChannels()
            return
        }

        setStatus("reconnecting")

        const handleNewCall = (payload: any) => {
            const newCall = payload.new as Call
            setCalls(prev => [newCall, ...prev])
            toast.info(`Incoming call`, {
                description: `From ${newCall.customer_phone}`,
                style: { borderLeftColor: 'var(--color-primary-500)', borderLeftWidth: '4px' }
            })
        }

        const handleUpdateCall = (payload: any) => {
            const updatedCall = payload.new as Call
            setCalls(prev => prev.map(c => c.id === updatedCall.id ? updatedCall : c))
            if (updatedCall.outcome === "failed" || updatedCall.outcome === "transferred") {
                toast.warning(`Call Status Update`, {
                    description: `Call transferred to human or failed.`,
                })
            }
        }

        const handleNewAppointment = (payload: any) => {
            const newApt = payload.new as Appointment
            setAppointments(prev => [newApt, ...prev])
            toast.success(`Booking Confirmed!`, {
                description: `New appointment booked for ${newApt.customer_name}`,
            })
        }

        const channel = supabase
            .channel('schema-db-changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls' }, handleNewCall)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls' }, handleUpdateCall)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' }, handleNewAppointment)
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    setStatus("connected")
                } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                    setStatus("offline")
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [isDemoMode])

    // Timer loop to increase active call durations (Mock visually)
    useEffect(() => {
        // Only increment duration for recent calls in demo mode that aren't booked/failed
        const timer = setInterval(() => {
            setCalls(prevCalls => {
                let changed = false
                const updated = prevCalls.map(c => {
                    // If the call is very recent (under 1 min) and outcome not final, tick it up
                    // For demo purposes, let's just tick any mock call that has outcome="ringing"
                    if (c.outcome === "ringing" as any) {
                        changed = true
                        return { ...c, duration_seconds: (c.duration_seconds || 0) + 1 }
                    }
                    return c
                })
                return changed ? updated : prevCalls
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    // Demo actions
    const simulateIncomingCall = () => {
        if (!isDemoMode) return
        const newCall: Call = {
            id: `mock-${Date.now()}`,
            business_id: "demo",
            customer_phone: `+91-${Math.floor(Math.random() * 90000 + 10000)}-${Math.floor(Math.random() * 90000 + 10000)}`,
            duration_seconds: 0,
            outcome: "ringing" as any, // Temporary state for demo
            transcript: "",
            recording_url: "",
            created_at: formatISO(new Date()),
        }
        setCalls(prev => [newCall, ...prev])
        toast.info(`Incoming call`, {
            description: `From ${newCall.customer_phone}`,
            style: { borderLeftColor: 'var(--color-primary-500)', borderLeftWidth: '4px' }
        })

        // Auto convert to completed after 10s
        setTimeout(() => {
            setCalls(prev => prev.map(c =>
                c.id === newCall.id
                    ? { ...c, outcome: Math.random() > 0.5 ? "booked" : "transferred" }
                    : c
            ))
            if (Math.random() > 0.5) simulateBooking()
        }, 10000)
    }

    const simulateBooking = () => {
        if (!isDemoMode) return
        const newApt: Appointment = {
            id: `mock-apt-${Date.now()}`,
            business_id: "demo",
            call_id: "mock",
            customer_name: ["Aman", "Priya", "Rahul", "Sneha"][Math.floor(Math.random() * 4)] + " Patel",
            customer_phone: "+91-99999-00000",
            appointment_date: formatISO(new Date()).split('T')[0],
            appointment_time: "14:00:00",
            reason: "Follow-up",
            status: "confirmed",
            created_at: formatISO(new Date()),
        }
        setAppointments(prev => [newApt, ...prev])
        toast.success(`Booking Confirmed!`, {
            description: `New appointment booked for ${newApt.customer_name}`,
        })
    }

    return (
        <LiveContext.Provider value={{ status, calls, appointments, simulateIncomingCall, simulateBooking }}>
            {children}
        </LiveContext.Provider>
    )
}

export const useLive = () => useContext(LiveContext)
