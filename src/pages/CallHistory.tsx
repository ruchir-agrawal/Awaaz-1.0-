import { useState } from "react"
import { useBusinessData } from "@/hooks/useBusinessData"
import { useCallsData } from "@/hooks/useCallsData"
import type { Call } from "@/types/database"
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns"
import { Search, ArrowUpDown, X, FileText, PhoneCall } from "lucide-react"
import { cn } from "@/lib/utils"

const C = {
  gold: "#c9a227", goldLight: "rgba(201,162,39,0.1)", goldBorder: "rgba(201,162,39,0.18)",
  terra: "#c4643a", terraLight: "rgba(196,100,58,0.1)", terraBorder: "rgba(196,100,58,0.18)",
  text: "#f0ede8", textMuted: "rgba(240,237,232,0.4)", textGhost: "rgba(240,237,232,0.15)",
  surface: "#0f0f0f", elevated: "#141414", border: "rgba(255,255,255,0.06)",
}

const OUTCOME_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  booked: { label: "Booked", color: "#5c9e6e", bg: "rgba(92,158,110,0.12)" },
  transferred: { label: "Transferred", color: "#c9a227", bg: "rgba(201,162,39,0.1)" },
  completed: { label: "Completed", color: "#4a7fa5", bg: "rgba(74,127,165,0.1)" },
  failed: { label: "Failed", color: "#c4643a", bg: "rgba(196,100,58,0.1)" },
  missed: { label: "Missed", color: "rgba(240,237,232,0.3)", bg: "rgba(255,255,255,0.05)" },
  "in-progress": { label: "In Progress", color: "#c9a227", bg: "rgba(201,162,39,0.1)" },
}

export default function CallHistory() {
  const { business } = useBusinessData()
  const { calls, loading } = useCallsData(business?.id)
  const [searchQuery, setSearchQuery] = useState("")
  const [outcomeFilter, setOutcomeFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)

  const formatDuration = (s: number) => !s ? "0s" : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
  const maskPhone = (p: string | null) => !p ? "Unknown" : p.replace(/(\d{4})$/, "XXXX")

  const filtered = calls
    .filter(call => {
      const sl = searchQuery.toLowerCase()
      const matchSearch = !searchQuery || (call.customer_phone?.toLowerCase() ?? "").includes(sl) || (call.transcript?.toLowerCase() ?? "").includes(sl)
      const matchOutcome = outcomeFilter === "all" || call.outcome === outcomeFilter
      let matchDate = true
      if (dateFrom && dateTo) {
        const cd = parseISO(call.created_at)
        matchDate = isWithinInterval(cd, { start: startOfDay(new Date(dateFrom)), end: endOfDay(new Date(dateTo)) })
      }
      return matchSearch && matchOutcome && matchDate
    })
    .sort((a, b) => sortOrder === "desc"
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-t-[#c9a227] border-white/10 animate-spin" />
      </div>
    )
  }

  const inputClass = "bg-transparent border rounded-xl px-3 py-2 text-[13px] outline-none transition-all focus:border-[rgba(201,162,39,0.4)] placeholder-[rgba(240,237,232,0.2)]"

  return (
    <div style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] tracking-[0.25em] uppercase mb-2" style={{ color: C.textMuted }}>Owner Portal</p>
        <h1 className="text-[2.2rem] leading-tight" style={{ fontFamily: "'Instrument Serif', serif", color: C.text }}>
          Call History
        </h1>
        <p className="text-[14px] mt-1" style={{ color: C.textMuted }}>Every conversation your agent has handled.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: C.textMuted }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by phone or transcript…"
            className={cn(inputClass, "pl-9 w-full")} style={{ borderColor: C.border, color: C.text }} />
        </div>
        <select value={outcomeFilter} onChange={e => setOutcomeFilter(e.target.value)}
          className={cn(inputClass, "min-w-[140px]")} style={{ borderColor: C.border, color: C.text }}>
          <option value="all">All Outcomes</option>
          {Object.entries(OUTCOME_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className={inputClass} style={{ borderColor: C.border, color: C.text }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className={inputClass} style={{ borderColor: C.border, color: C.text }} />
        {(searchQuery || outcomeFilter !== "all" || dateFrom || dateTo) && (
          <button onClick={() => { setSearchQuery(""); setOutcomeFilter("all"); setDateFrom(""); setDateTo("") }}
            className="flex items-center gap-1 text-[12px] transition-colors hover:opacity-70"
            style={{ color: C.textMuted }}>
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
        <button onClick={() => setSortOrder(s => s === "desc" ? "asc" : "desc")}
          className="flex items-center gap-1.5 text-[12px] px-3 py-2 rounded-xl border transition-all hover:border-[rgba(201,162,39,0.3)]"
          style={{ borderColor: C.border, color: C.textMuted }}>
          <ArrowUpDown className="w-3.5 h-3.5" />
          {sortOrder === "desc" ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.border }}>
        {/* Table header */}
        <div className="grid grid-cols-[1fr_120px_100px_100px_90px_48px] px-5 py-3 border-b text-[11px] font-medium uppercase tracking-[0.15em]"
          style={{ background: C.elevated, borderColor: C.border, color: C.textMuted }}>
          <span>Customer</span><span>Time</span><span>Duration</span><span>Outcome</span><span>Source</span><span />
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20" style={{ background: C.surface }}>
            <PhoneCall className="w-8 h-8 mb-4 opacity-20" style={{ color: C.text }} />
            <p className="text-[14px]" style={{ color: C.textMuted }}>No calls match your filters.</p>
          </div>
        ) : (
          filtered.map((call, idx) => {
            const os = OUTCOME_STYLES[call.outcome] ?? { label: call.outcome, color: C.textMuted, bg: "transparent" }
            return (
              <div key={call.id}
                className="grid grid-cols-[1fr_120px_100px_100px_90px_48px] px-5 py-4 border-b transition-colors cursor-pointer hover:bg-white/[0.02]"
                style={{ background: idx % 2 === 0 ? C.surface : "rgba(255,255,255,0.01)", borderColor: C.border }}
                onClick={() => setSelectedCall(call)}>
                <span className="text-[13px] font-medium" style={{ color: C.text }}>{maskPhone(call.customer_phone)}</span>
                <span className="text-[12px]" style={{ color: C.textMuted }}>{format(parseISO(call.created_at), "MMM dd, HH:mm")}</span>
                <span className="text-[12px] font-mono tabular-nums" style={{ color: C.textMuted }}>{formatDuration(call.duration_seconds)}</span>
                <span>
                  <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ color: os.color, background: os.bg }}>
                    {os.label}
                  </span>
                </span>
                <span className="text-[11px] capitalize" style={{ color: C.textMuted }}>{call.call_source}</span>
                <button className="flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
                  onClick={e => { e.stopPropagation(); setSelectedCall(call) }}>
                  <FileText className="w-4 h-4" style={{ color: C.text }} />
                </button>
              </div>
            )
          })
        )}
      </div>

      <p className="text-[11px] text-center mt-4" style={{ color: C.textMuted }}>
        {filtered.length} calls shown
      </p>

      {/* Transcript slide panel */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCall(null)} />
          <div className="relative w-full max-w-lg h-full border-l flex flex-col overflow-hidden"
            style={{ background: "#0d0d0d", borderColor: C.border, fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: C.border }}>
              <div>
                <h3 className="text-[15px] font-semibold" style={{ color: C.text }}>Call Transcript</h3>
                <p className="text-[12px] mt-0.5" style={{ color: C.textMuted }}>
                  {format(parseISO(selectedCall.created_at), "MMM dd, yyyy · HH:mm")}
                </p>
              </div>
              <button onClick={() => setSelectedCall(null)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors">
                <X className="w-4 h-4" style={{ color: C.textMuted }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  ["Phone", maskPhone(selectedCall.customer_phone)],
                  ["Duration", formatDuration(selectedCall.duration_seconds)],
                  ["Language", selectedCall.language_detected ?? "—"],
                  ["Source", selectedCall.call_source],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl p-3 border" style={{ background: C.surface, borderColor: C.border }}>
                    <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.textMuted }}>{k}</div>
                    <div className="text-[13px] font-medium capitalize" style={{ color: C.text }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="text-[12px] uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>Transcript</div>
              <div className="rounded-xl p-4 border text-[13px] leading-relaxed whitespace-pre-wrap"
                style={{ background: C.surface, borderColor: C.border, color: selectedCall.transcript ? C.text : C.textMuted }}>
                {selectedCall.transcript ?? "No transcript available for this call."}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
