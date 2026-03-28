import { useState } from "react"
import { useDemo } from "@/contexts/DemoContext"
import { useLive } from "@/contexts/LiveContext"
import type { Call } from "@/types/database"
import { format } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/Table"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Play, FileText, Search, ArrowUpDown } from "lucide-react"

export default function CallHistory() {
    const { isDemoMode } = useDemo()
    const { calls } = useLive()
    const [searchQuery, setSearchQuery] = useState("")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

    const formatDuration = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}m ${secs}s`
    }

    const maskPhone = (phone: string) => {
        // Example format: +91-98765-XXXXX
        return phone.replace(/(\d{5})$/, "XXXXX")
    }

    const getOutcomeBadge = (outcome: Call["outcome"]) => {
        switch (outcome) {
            case "booked":
                return <Badge variant="success">Booked</Badge>
            case "transferred":
                return <Badge variant="warning">Transferred</Badge>
            case "failed":
                return <Badge variant="destructive">Failed</Badge>
            default:
                return <Badge>Unknown</Badge>
        }
    }

    const filteredAndSortedCalls = calls
        .filter(call =>
            call.customer_phone.includes(searchQuery) ||
            call.outcome.includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime()
            const dateB = new Date(b.created_at).getTime()
            return sortOrder === "asc" ? dateA - dateB : dateB - dateA
        })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Call History</h1>
                <p className="text-muted-foreground">Review recent interactions handeled by your AI receptionist.</p>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by phone or outcome..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button
                    variant="outline"
                    onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                    className="shrink-0"
                >
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    Sort by Date
                </Button>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Outcome</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedCalls.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    {isDemoMode ? "No calls found matching search." : "No calls yet today. Enable demo mode to see mock data."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAndSortedCalls.map((call) => (
                                <TableRow key={call.id}>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {format(new Date(call.created_at), "MMM d, yyyy - h:mm a")}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {maskPhone(call.customer_phone)}
                                    </TableCell>
                                    <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
                                    <TableCell>{getOutcomeBadge(call.outcome)}</TableCell>
                                    <TableCell className="text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" title="Play Recording">
                                                <Play className="h-4 w-4" />
                                                <span className="sr-only">Play</span>
                                            </Button>
                                            <Button variant="outline" size="sm" title="View Transcript">
                                                <FileText className="h-4 w-4" />
                                                <span className="sr-only">Transcript</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
