import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Business } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'

export function useBusinessData() {
    const { user, userRole } = useAuth()
    const [business, setBusiness] = useState<Business | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBusiness = useCallback(async () => {
        if (!user || userRole !== 'owner') {
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('owner_id', user.id)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    setBusiness(null)
                } else {
                    throw error
                }
            } else {
                setBusiness(data as Business)
            }
        } catch (err: unknown) {
            const errObj = err as Error
            console.error("Error fetching business:", errObj)
            setError(errObj.message)
        } finally {
            setLoading(false)
        }
    }, [user, userRole])

    useEffect(() => {
        fetchBusiness()
    }, [fetchBusiness])

    return { business, loading, error, refetch: fetchBusiness }
}
