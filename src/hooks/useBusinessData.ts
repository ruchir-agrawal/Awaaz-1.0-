import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Business } from '@/types/database'
import { useAuth } from '@/contexts/AuthContext'

export function useBusinessData() {
    const { user, userRole } = useAuth()
    const [business, setBusiness] = useState<Business | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBusiness = async () => {
        if (!user || userRole !== 'owner') {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
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
        } catch (err: any) {
            console.error("Error fetching business:", err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBusiness()
    }, [user, userRole])

    return { business, loading, error, refetch: fetchBusiness }
}
