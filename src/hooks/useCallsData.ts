import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Call } from '@/types/database'
import { toast } from 'sonner'

export function useCallsData(businessId: string | undefined) {
    const [calls, setCalls] = useState<Call[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!businessId) {
            setLoading(false)
            return
        }

        let isMounted = true

        const fetchCalls = async () => {
            setLoading(true)
            const { data, error } = await supabase
                .from('calls')
                .select('*')
                .eq('business_id', businessId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Error fetching calls:", error)
            } else if (data && isMounted) {
                setCalls(data as Call[])
            }
            if (isMounted) setLoading(false)
        }

        fetchCalls()

        const channel = supabase
            .channel(`calls-${businessId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls', filter: `business_id=eq.${businessId}` }, (payload) => {
                const newCall = payload.new as Call
                setCalls(prev => [newCall, ...prev])
                toast.info(`Incoming call`, {
                    description: `From ${newCall.customer_phone || 'Unknown'}`,
                    style: { borderLeftColor: 'var(--color-primary-500)', borderLeftWidth: '4px' }
                })
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls', filter: `business_id=eq.${businessId}` }, (payload) => {
                const updatedCall = payload.new as Call
                setCalls(prev => prev.map(c => c.id === updatedCall.id ? updatedCall : c))
                if (updatedCall.outcome === "failed" || updatedCall.outcome === "transferred") {
                    toast.warning(`Call Status Update`, {
                        description: `Call transferred to human or failed.`,
                    })
                }
            })
            .subscribe()

        return () => {
            isMounted = false
            supabase.removeChannel(channel)
        }
    }, [businessId])

    const activeCalls = calls.filter(c => c.outcome === 'in-progress')

    return { calls, loading, activeCalls }
}
