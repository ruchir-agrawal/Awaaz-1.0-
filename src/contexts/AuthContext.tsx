import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Profile, UserRole } from "@/types/database"

interface AuthContextType {
    session: Session | null
    user: User | null
    profile: Profile | null
    userRole: UserRole | null
    isAdmin: boolean
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    userRole: null,
    isAdmin: false,
    loading: true,
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        const fetchProfile = async (userId: string) => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
            
            if (error) {
                console.error("Error fetching profile:", error)
            } else if (isMounted) {
                setProfile(data as Profile)
            }
        }

        const handleAuthChange = async (newSession: Session | null) => {
            setSession(newSession)
            setUser(newSession?.user ?? null)
            
            if (newSession?.user) {
                await fetchProfile(newSession.user.id)
            } else {
                setProfile(null)
            }
            if (isMounted) setLoading(false)
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            handleAuthChange(session)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            handleAuthChange(session)
        })

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    const userRole = profile?.role ?? null
    const isAdmin = userRole === 'admin'

    return (
        <AuthContext.Provider value={{ session, user, profile, userRole, isAdmin, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext)
}
