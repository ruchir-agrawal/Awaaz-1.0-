import { useState } from "react"
import { useDemo } from "@/contexts/DemoContext"
import { useLive } from "@/contexts/LiveContext"
import type { Appointment } from "@/types/database"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Calendar as CalendarIcon, Clock, Phone, User, CalendarSync } from "lucide-react"

export default function Appointments() {
    const { isDemoMode } = useDemo()
    const { appointments } = useLive()
    const [syncing, setSyncing] = useState(false)

    const handleSync = () => {
        setSyncing(true)
        setTimeout(() => setSyncing(false), 2000)
    }

    const getStatusBadge = (status: Appointment["status"]) => {
        switch (status) {
            case "confirmed":
                return <Badge variant="success">Confirmed</Badge>
            case "pending":
                return <Badge variant="warning">Pending</Badge>
            case "completed":
                return <Badge variant="default">Completed</Badge>
            case "cancelled":
                return <Badge variant="destructive">Cancelled</Badge>
            default:
                return <Badge>Unknown</Badge>
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
                    <p className="text-muted-foreground">Manage upcoming meetings gracefully booked by your AI bot.</p>
                </div>
                <Button onClick={handleSync} disabled={syncing}>
                    <CalendarSync className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Syncing..." : "Sync with Google Calendar"}
                </Button>
            </div>

            {appointments.length === 0 ? (
                <Card className="h-64 flex flex-col items-center justify-center text-center p-6 border-dashed border-2">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">No appointments yet</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                        {isDemoMode
                            ? "We couldn't find any upcoming appointments."
                            : "Enable demo mode or start receiving live calls to see your appointments here."}
                    </p>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {appointments.map((apt) => (
                        <Card key={apt.id} className="hover:border-primary-600 transition-colors shadow-sm">
                            <CardHeader className="pb-3 relative">
                                <div className="absolute top-6 right-6">
                                    {getStatusBadge(apt.status)}
                                </div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary-600" />
                                    {apt.customer_name}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5" />
                                    {apt.customer_phone}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex rounded-md bg-muted p-3 items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-background text-primary-600 font-bold border border-border">
                                            {format(parseISO(apt.appointment_date), "d")}
                                            <br />
                                            <span className="text-[10px] uppercase leading-none">{format(parseISO(apt.appointment_date), "MMM")}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none flex items-center">
                                                <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                                {format(parseISO(apt.appointment_date), "EEEE, MMMM d")}
                                            </p>
                                            <p className="text-sm text-muted-foreground flex items-center">
                                                <Clock className="h-3.5 w-3.5 mr-1" />
                                                {apt.appointment_time.substring(0, 5)} {/* Simple 24h format HH:mm */}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reason for visit</h4>
                                        <p className="text-sm">{apt.reason || "Not specified"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
