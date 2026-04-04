import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Appointment } from '@/types/database'
import { isToday, isFuture, parseISO } from 'date-fns'
import { toast } from 'sonner'

export function useAppointmentsData(businessId: string | undefined) {
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!businessId) {
            setLoading(false)
            return
        }

        let isMounted = true

        const fetchApts = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('business_id', businessId)
                .order('appointment_date', { ascending: true })
                .order('appointment_time', { ascending: true })

            if (error) {
                console.error("Error fetching appointments:", error)
            } else if (data && isMounted) {
                setAppointments(data as Appointment[])
            }
            if (isMounted) setLoading(false)
        }

        fetchApts()

        const channel = supabase
            .channel(`appointments-${businessId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments', filter: `business_id=eq.${businessId}` }, (payload) => {
                const newApt = payload.new as Appointment
                setAppointments(prev => {
                    const next = [...prev, newApt]
                    next.sort((a, b) => {
                        return new Date(`${a.appointment_date}T${a.appointment_time}`).getTime() - new Date(`${b.appointment_date}T${b.appointment_time}`).getTime()
                    })
                    return next
                })
                toast.success(`Booking Confirmed!`, {
                    description: `New appointment booked for ${newApt.customer_name}`,
                })
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `business_id=eq.${businessId}` }, (payload) => {
                const updatedApt = payload.new as Appointment
                setAppointments(prev => prev.map(a => a.id === updatedApt.id ? updatedApt : a))
            })
            .subscribe()

        return () => {
            isMounted = false
            supabase.removeChannel(channel)
        }

    }, [businessId])

    const todayCount = appointments.filter(a => isToday(parseISO(a.appointment_date)) && a.status === 'confirmed').length
    const upcomingCount = appointments.filter(a => isFuture(parseISO(a.appointment_date)) && a.status === 'confirmed').length

    return { appointments, loading, todayCount, upcomingCount }
}
