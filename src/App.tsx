import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { useAuth } from "./contexts/AuthContext"
import { Toaster } from "sonner"
import { Loader2 } from "lucide-react"

// Smart redirect: sends admins to /admin, owners to /owner
function RoleBasedRedirect() {
  const { session, userRole, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  if (userRole === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/owner" replace />
}

import Login from "./pages/Login"
import SignUp from "./pages/SignUp"
import Landing from "./pages/Landing"
import PublicCall from "./pages/PublicCall"

import { OwnerLayout } from "./components/layout/OwnerLayout"
import Dashboard from "./pages/Dashboard"
import CallHistory from "./pages/CallHistory"
import Appointments from "./pages/Appointments"
import Analytics from "./pages/Analytics"
import Playground from "./pages/Playground"
import Settings from "./pages/Settings"

import { AdminLayout } from "./components/layout/AdminLayout"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminOwnersList from "./pages/admin/Owners"
import AdminOwnerDetail from "./pages/admin/OwnerDetail"
import AdminHealth from "./pages/admin/Health"
import AdminApiMonitor from "./pages/admin/ApiMonitor"
import AdminBilling from "./pages/admin/Billing"

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* Main interface routing stubbed. Full Admin/Owner routing to follow. */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute requiredRole="owner">
            <OwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="calls" element={<CallHistory />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="owners" element={<AdminOwnersList />} />
        <Route path="owners/:id" element={<AdminOwnerDetail />} />
        <Route path="health" element={<AdminHealth />} />
        <Route path="api-monitor" element={<AdminApiMonitor />} />
        <Route path="playground" element={<Playground />} />
        <Route path="billing" element={<AdminBilling />} />
      </Route>

      <Route path="/call/:slug" element={<PublicCall />} />

      <Route path="/dashboard" element={<RoleBasedRedirect />} />
      <Route path="/" element={<Landing />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" richColors theme="light" />
      </Router>
    </AuthProvider>
  )
}
