import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Business, Profile, ApiUsage } from '@/types/database'

export function useAdminData() {
    const { isAdmin } = useAuth()
    const [owners, setOwners] = useState<(Profile & { businesses: Business[] })[]>([])
    const [apiUsageToday, setApiUsageToday] = useState<ApiUsage[]>([])
    const [totalCallsToday, setTotalCallsToday] = useState(0)
    const [totalAppointmentsToday, setTotalAppointmentsToday] = useState(0)
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        if (!isAdmin) {
            setLoading(false)
            return
        }

        setLoading(true)
        
        // fetch profiles with role owner
        const { data: ownersData, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'owner')
            
        if (profError) {
            console.error("Error fetching owners:", profError)
            setLoading(false)
            return
        }
        
        // fetch businesses
        const { data: bizData } = await supabase.from('businesses').select('*')
        
        const todayStr = new Date().toISOString().split('T')[0]
        const startOfDay = `${todayStr}T00:00:00Z`
        
        // fetch api_usage for today
        const { data: usageData } = await supabase
            .from('api_usage')
            .select('*')
            .gte('created_at', startOfDay)

        // fetch aggs for system UI
        const { count: callsCount } = await supabase
            .from('calls')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay)
            
        const { count: aptCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay)

        if (bizData) {
            const combined = ownersData.map(owner => ({
                ...owner,
                businesses: bizData.filter(b => b.owner_id === owner.id)
            })) as (Profile & { businesses: Business[] })[]
            setOwners(combined)
        }
        
        if (usageData) {
            setApiUsageToday(usageData as ApiUsage[])
        }
        
        setTotalCallsToday(callsCount || 0)
        setTotalAppointmentsToday(aptCount || 0)

        setLoading(false)
    }, [isAdmin])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const totalCostToday = apiUsageToday.reduce((sum, item) => sum + item.cost_inr, 0)

    return { 
        owners, 
        loading, 
        apiUsageToday, 
        totalCostToday, 
        totalCallsToday, 
        totalAppointmentsToday,
        refresh: fetchData 
    }
}
