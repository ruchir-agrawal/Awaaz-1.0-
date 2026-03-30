import { useState, useEffect, useCallback } from 'react'
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
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'calls', filter: `business_id=eq.${businessId}` }, (payload) => {
                setCalls(prev => prev.filter(c => c.id !== payload.old.id))
            })
            .subscribe()

        return () => {
            isMounted = false
            supabase.removeChannel(channel)
        }
    }, [businessId])

    // Delete a call log permanently
    const deleteCall = useCallback(async (callId: string) => {
        // Optimistic update — remove from UI immediately
        setCalls(prev => prev.filter(c => c.id !== callId))
        const { error } = await supabase.from('calls').delete().eq('id', callId)
        if (error) {
            console.error("Delete failed:", error)
            toast.error("Failed to delete call log.")
            // Refresh to restore state
            const { data } = await supabase.from('calls').select('*').eq('business_id', businessId).order('created_at', { ascending: false })
            if (data) setCalls(data as Call[])
        } else {
            toast.success("Call log deleted.")
        }
    }, [businessId])

    // Resolve a stuck 'in-progress' call (marks it as completed)
    const resolveCall = useCallback(async (callId: string) => {
        setCalls(prev => prev.map(c => c.id === callId ? { ...c, outcome: 'completed' } : c))
        const { error } = await supabase.from('calls').update({ outcome: 'completed' }).eq('id', callId)
        if (error) {
            console.error("Resolve failed:", error)
            toast.error("Failed to resolve call.")
        } else {
            toast.success("Call marked as completed.")
        }
    }, [])

    const activeCalls = calls.filter(c => c.outcome === 'in-progress')

    return { calls, loading, activeCalls, deleteCall, resolveCall }
}
