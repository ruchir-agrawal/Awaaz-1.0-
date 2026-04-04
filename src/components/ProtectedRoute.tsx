import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

interface ProtectedRouteProps {
    children: React.ReactNode
    requiredRole?: 'admin' | 'owner'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { session, loading, userRole } = useAuth()

    // Wait until initial session and profile are resolved
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    if (requiredRole) {
        if (requiredRole === 'admin' && userRole === 'owner') {
            return <Navigate to="/owner" replace />
        }
        if (requiredRole === 'owner' && userRole === 'admin') {
            return <Navigate to="/admin" replace />
        }
    }

    return <>{children}</>
}
