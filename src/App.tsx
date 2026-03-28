import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { DemoProvider } from "./contexts/DemoContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { DashboardLayout } from "./components/layout/DashboardLayout"
import { LiveProvider } from "./contexts/LiveContext"
import { Toaster } from "sonner"

import Login from "./pages/Login"
import SignUp from "./pages/SignUp"
import Dashboard from "./pages/Dashboard"
import CallHistory from "./pages/CallHistory"
import Appointments from "./pages/Appointments"
import Analytics from "./pages/Analytics"
import Playground from "./pages/Playground"
import Settings from "./pages/Settings"
import PublicCall from "./pages/PublicCall"

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="calls" element={<CallHistory />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="playground" element={<Playground />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="/call/:slug" element={<PublicCall />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <DemoProvider>
      <AuthProvider>
        <LiveProvider>
          <Router>
            <AppRoutes />
            <Toaster position="top-right" richColors theme="light" />
          </Router>
        </LiveProvider>
      </AuthProvider>
    </DemoProvider>
  )
}
