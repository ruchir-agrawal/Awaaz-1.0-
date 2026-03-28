import { useDemo } from "@/contexts/DemoContext"
import { useLive } from "@/contexts/LiveContext"
import { getChartData } from "@/lib/mockData"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Tooltip } from "@/components/ui/Tooltip"
import {
    PhoneOutgoing,
    CalendarCheck,
    CheckCircle2,
    IndianRupee,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Copy,
    Share2,
    PhoneCall
} from "lucide-react"
import { toast } from "sonner"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip as RechartsTooltip
} from "recharts"

export default function Dashboard() {
    const { isDemoMode } = useDemo()
    const { calls: liveCalls, appointments: liveAppointments } = useLive()

    // Calculate Live Metrics based on current day
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const callsToday = liveCalls.filter(c => new Date(c.created_at) >= todayStart)
    const appointmentsToday = liveAppointments.filter(a => new Date(a.created_at) >= todayStart)

    const completedCallsToday = callsToday.filter(c => c.outcome === "booked" || c.outcome === "transferred" || c.outcome === "failed")
    const successfulCallsToday = completedCallsToday.filter(c => c.outcome === "booked" || c.outcome === "transferred")

    const successRate = completedCallsToday.length > 0
        ? Math.round((successfulCallsToday.length / completedCallsToday.length) * 100)
        : 0

    // Mock $1550 (INR 125,000 approx) average value per appointment
    const revenue = appointmentsToday.length * 1550

    const activeCalls = liveCalls.filter(c => c.outcome === "ringing" || c.outcome === "connected" || c.outcome === "in-progress")
    const agentStatus = isDemoMode ? "active" : "offline"

    const chartData = getChartData()

    const MetricCard = ({
        title,
        value,
        change,
        icon: Icon,
        tooltipText
    }: {
        title: string,
        value: string | number,
        change?: number,
        icon: any,
        tooltipText: string
    }) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Tooltip content={tooltipText}>
                    <CardTitle className="text-sm font-medium text-muted-foreground underline decoration-dashed decoration-muted-foreground/50 underline-offset-4 cursor-help">
                        {title}
                    </CardTitle>
                </Tooltip>
                <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold transition-all duration-300">{value}</div>
                {change !== undefined && (
                    <p className="flex items-center text-xs mt-1">
                        {change > 0 ? (
                            <span className="text-success-600 dark:text-success-500 flex items-center font-medium">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                {change}%
                            </span>
                        ) : change < 0 ? (
                            <span className="text-destructive dark:text-red-400 flex items-center font-medium">
                                <ArrowDownRight className="h-3 w-3 mr-1" />
                                {Math.abs(change)}%
                            </span>
                        ) : (
                            <span className="text-muted-foreground font-medium">
                                0%
                            </span>
                        )}
                        <span className="text-muted-foreground ml-1">from yesterday</span>
                    </p>
                )}
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
                    <p className="text-muted-foreground">Monitor your AI receptionist's performance.</p>
                </div>

                <Card className="flex items-center px-4 py-2 bg-card/50 backdrop-blur-sm border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="relative flex h-3 w-3">
                            {agentStatus === "active" && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                            )}
                            <span
                                className={`relative inline-flex rounded-full h-3 w-3 ${agentStatus === "active" ? "bg-success-500" : "bg-destructive"
                                    }`}
                            ></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">
                                Agent: {agentStatus === "active" ? "Active" : "Offline"}
                            </span>
                            {activeCalls.length > 0 && (
                                <span className="text-xs text-primary-600 dark:text-primary-400 flex items-center animate-pulse">
                                    <Activity className="h-3 w-3 mr-1" /> {activeCalls.length} Call(s) in progress
                                </span>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Public Call Link Banner */}
            <Card className="bg-primary/5 border-primary/20 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <PhoneCall className="h-24 w-24 text-primary" />
                </div>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="space-y-1 text-center md:text-left">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Share2 className="h-5 w-5 text-primary" />
                                Your Public AI Voice Link
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Share this link with your patients to let them talk to Ratan in real-time.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-xl border">
                                <code className="px-3 py-1 text-sm font-mono text-primary truncate max-w-[200px] sm:max-w-md">
                                    {window.location.origin}/call/sharmaji-dental
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/call/sharmaji-dental`);
                                        toast.success("Link copied to clipboard!");
                                    }}
                                    className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                                    title="Copy Link"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="bg-warning-500/10 border border-warning-500/20 p-2.5 rounded-xl flex items-start gap-2.5">
                                <div className="p-1 bg-warning-500/20 rounded-md shrink-0">
                                    <Activity className="h-3 w-3 text-warning-600 dark:text-warning-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-warning-700 dark:text-warning-400">Mobile Testing Guide</p>
                                    <p className="text-[11px] text-muted-foreground leading-tight">
                                        To test on your phone, run this in your terminal:<br />
                                        <code className="text-primary font-bold">npx localtunnel --port 5173</code>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {activeCalls.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeCalls.map((call) => (
                        <Card key={call.id} className="border-primary-500/50 bg-primary-50/50 dark:bg-primary-950/20 shadow-md animate-in slide-in-from-top-4">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 p-2 animate-pulse">
                                        <PhoneOutgoing className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium leading-none">{call.customer_phone.replace(/(\d{5})$/, "XXXXX")}</p>
                                        <p className="text-xs text-primary-700 dark:text-primary-300 mt-1 font-medium capitalize animate-pulse">
                                            {call.outcome}...
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-mono text-primary-700 dark:text-primary-300">
                                        {Math.floor((call.duration_seconds || 0) / 60)}:
                                        {((call.duration_seconds || 0) % 60).toString().padStart(2, "0")}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Calls Today"
                    value={callsToday.length}
                    change={isDemoMode ? 12.5 : undefined}
                    icon={PhoneOutgoing}
                    tooltipText="Total inbound and outbound calls handled today"
                />
                <MetricCard
                    title="Appointments Booked"
                    value={appointmentsToday.length}
                    change={isDemoMode ? 5.2 : undefined}
                    icon={CalendarCheck}
                    tooltipText="Number of distinct appointments successfully scheduled"
                />
                <MetricCard
                    title="Call Success Rate"
                    value={`${successRate}%`}
                    icon={CheckCircle2}
                    tooltipText="Percentage of calls that resulted in a booked appointment or successful resolution"
                />
                <MetricCard
                    title="Revenue Captured"
                    value={`₹${revenue.toLocaleString('en-IN')}`}
                    icon={IndianRupee}
                    tooltipText="Estimated value of booked appointments (mock metric)"
                />
            </div>

            <Card className="col-span-4 shadow-sm border-muted">
                <CardHeader>
                    <CardTitle>Call Volume (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="pl-0 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-primary-500)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--color-primary-500)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--color-muted-foreground)' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--color-muted-foreground)' }}
                                dx={-10}
                            />
                            <RechartsTooltip
                                contentStyle={{
                                    backgroundColor: 'var(--color-card)',
                                    borderColor: 'var(--color-border)',
                                    borderRadius: '0.5rem',
                                    color: 'var(--color-foreground)'
                                }}
                                itemStyle={{ color: 'var(--color-foreground)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="calls"
                                stroke="var(--color-primary-500)"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCalls)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
