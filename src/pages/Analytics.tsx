import { useState } from "react"
import { useDemo } from "@/contexts/DemoContext"
import {
    getAnalyticsCallVolume,
    getAnalyticsConversion,
    getAnalyticsOutcomes
} from "@/lib/mockData"
import { toast } from "sonner"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts"
import {
    Download,
    Share2,
    TrendingUp,
    Clock,
    Calendar,
    Users,
    BrainCircuit,
    PieChart as PieChartIcon,
    PhoneCall,
    IndianRupee,
    Star
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function Analytics() {
    const { isDemoMode } = useDemo()
    const [timeRange, setTimeRange] = useState<"1" | "7" | "30">("7")

    // Fetch mock data based on the selected time range
    const days = parseInt(timeRange)
    const volumeData = getAnalyticsCallVolume(days)
    const conversionData = getAnalyticsConversion(days)
    const outcomesData = getAnalyticsOutcomes()

    const handleDownloadReport = () => {
        toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
            loading: 'Generating PDF report...',
            success: 'Report downloaded successfully!',
            error: 'Failed to generate report'
        })
    }

    const handleShareReport = () => {
        navigator.clipboard.writeText("https://awaaz.com/analytics/shared/1a2b3c")
        toast.success("Link copied to clipboard", {
            description: "Anyone with this link can view a readonly version of this dashboard."
        })
    }

    const InsightCard = ({ icon: Icon, title, description, highlight }: any) => (
        <Card className="flex flex-row items-center gap-4 p-4 border-l-4 border-l-primary-500 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
                <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
                <h4 className="font-semibold">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
                <span className="inline-flex mt-1 text-xs font-medium text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded-md">
                    {highlight}
                </span>
            </div>
        </Card>
    )

    const ComparisonCard = ({ title, before, after, icon: Icon }: any) => (
        <Card className="relative overflow-hidden group hover:border-primary-500/50 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Icon className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2">
                <CardDescription className="font-medium tracking-wide uppercase text-xs">{title}</CardDescription>
                <CardTitle className="text-2xl font-bold flex items-baseline gap-2">
                    {after}
                    <span className="text-sm font-normal text-success-600 dark:text-success-400 flex items-center bg-success-50 dark:bg-success-950 px-2 py-0.5 rounded-full">
                        <TrendingUp className="h-3 w-3 mr-1" /> from {before}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                <p className="text-xs text-muted-foreground">Impact since using Awaaz AI</p>
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-8">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
                    <p className="text-muted-foreground">Deep dive into your AI agent's performance and ROI.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 w-full sm:w-auto">
                        {[
                            { label: "Today", value: "1" },
                            { label: "7 Days", value: "7" },
                            { label: "30 Days", value: "30" }
                        ].map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setTimeRange(tab.value as any)}
                                className={cn(
                                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                                    timeRange === tab.value
                                        ? "bg-background text-foreground shadow"
                                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={handleShareReport}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                        </Button>
                        <Button size="sm" onClick={handleDownloadReport}>
                            <Download className="h-4 w-4 mr-2" />
                            Report
                        </Button>
                    </div>
                </div>
            </div>

            {/* ROI Comparison Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <ComparisonCard title="Calls Answered" before="60%" after="97%" icon={PhoneCall} />
                <ComparisonCard title="Monthly Revenue" before="₹45k" after="₹82k" icon={IndianRupee} />
                <ComparisonCard title="Customer Satisfaction" before="3.2/5" after="4.7/5" icon={Star} />
            </div>

            {/* AI Insights */}
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-primary-600" />
                    Auto-Generated AI Insights
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                    <InsightCard
                        icon={Clock}
                        title="Peak Call Volume"
                        description="Most callers try to reach you during late morning hours."
                        highlight="10:00 AM - 12:00 PM (32% of total)"
                    />
                    <InsightCard
                        icon={Calendar}
                        title="Highest Booking Rate"
                        description="Tuesdays convert inquiries into appointments significantly better."
                        highlight="78% conversion on Tuesdays"
                    />
                    <InsightCard
                        icon={Users}
                        title="Common Reason for Visit"
                        description="Awaaz identified a trend in customer requests this week."
                        highlight="Tooth Cleaning & Whitening (45%)"
                    />
                    <InsightCard
                        icon={PhoneCall}
                        title="Average Conversation"
                        description="Your AI is keeping customers engaged without wasting time."
                        highlight="2m 15s avg duration"
                    />
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Call Volume Chart */}
                <Card className="col-span-1 md:col-span-2 shadow-sm animate-in slide-in-from-bottom-6 duration-700">
                    <CardHeader>
                        <CardTitle>Call Volume Analysis</CardTitle>
                        <CardDescription>Hourly breakdown of calls answered by Awaaz vs. calls missed outside hours.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={volumeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} dy={10} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} dx={-10} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', backdropFilter: 'blur(8px)' }}
                                    itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                                    labelStyle={{ color: 'var(--color-muted-foreground)', marginBottom: '8px' }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Line
                                    type="monotone"
                                    name="Answered by AI"
                                    dataKey="answered"
                                    stroke="var(--color-primary-500)"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: 'var(--color-background)', strokeWidth: 2 }}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-primary-600)' }}
                                />
                                <Line
                                    type="monotone"
                                    name="Missed"
                                    dataKey="missed"
                                    stroke="var(--color-destructive)"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ r: 3, fill: 'var(--color-background)', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Booking Conversion Bar Chart */}
                <Card className="shadow-sm animate-in zoom-in-95 duration-500 delay-150">
                    <CardHeader>
                        <CardTitle>Booking Conversion</CardTitle>
                        <CardDescription>Inquiries vs successful appointments scheduled.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={conversionData} margin={{ top: 20, right: 0, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" className="opacity-50" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} dy={10} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)' }}
                                />
                                <Legend iconType="rect" />
                                <Bar dataKey="inquiries" name="Inquiry Calls" fill="var(--color-primary-200)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="booked" name="Booked Appts" fill="var(--color-primary-600)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Call Outcomes Pie Chart */}
                <Card className="shadow-sm animate-in zoom-in-95 duration-500 delay-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Outcome Distribution <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>How the AI agent resolved its calls.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={outcomesData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {outcomesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `${value}%`}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--color-card)' }}
                                    itemStyle={{ color: 'var(--color-foreground)', fontWeight: 600 }}
                                />
                                <Legend
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                    align="center"
                                    iconType="circle"
                                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {!isDemoMode && (
                <div className="rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-warning-800 dark:border-warning-900/50 dark:bg-warning-950/20 dark:text-warning-500 text-sm">
                    <strong>Note:</strong> You are viewing real production data which may be sparse right now. Toggle <strong>Demo Mode</strong> in the sidebar to visualize a fully loaded analytics dashboard.
                </div>
            )}
        </div>
    )
}
