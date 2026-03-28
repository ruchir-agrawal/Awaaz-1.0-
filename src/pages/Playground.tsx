import { useState, useEffect, useRef } from "react"
import { useVoiceAgent } from "@/hooks/useVoiceAgent"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import {
    Mic,
    Square,
    Trash2,
    BrainCircuit,
    Activity,
    AlertCircle,
    RefreshCw,
    Settings as SettingsIcon,
    X,
    Database,
    Zap,
    MessageSquare
} from "lucide-react"

export default function Playground() {
    const [model, setModel] = useState("qwen2.5:7b")
    const [useCloudLLM, setUseCloudLLM] = useState(true)
    const [llmProvider, setLlmProvider] = useState<"groq" | "xai" | "gemini">("groq")
    const [showSettings, setShowSettings] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const isContinuous = true

    // Professional Dental Prompt - Mirrors language spoken
    const [systemPrompt, setSystemPrompt] = useState("");

    useEffect(() => {
        // Generate a simple random UID for the session
        const sessionUid = "SDH-" + Math.random().toString(36).substring(2, 6).toUpperCase();

        setSystemPrompt(`Role: Shubh, a friendly and warm receptionist for Sharmaji Dental Hub, Vadodara.

Tone & Personality:
- Conversational & Flowy: Be polite, warm, and professional. Avoid being too robotic or overly short. Sound like a helpful human assistant.
- Hinglish: Mix Hindi and English naturally. Use standard English for dental terms and professional greetings.
- Acknowledgments: Use phrases like "Theek hai, sure!", "Ji, bilkul", "Got it, note kar liya".

Language & Numbers (STRICT):
- MIRROR: Use English digits/times ALWAYS (e.g. "931 368", "10 AM"). NEVER translate them to Hindi.
- SYMBOLS: Read digits with spaces. Never say "minus" for "-".

GOOGLE ACTIONS:
- [UID]: Your private session ID is ${sessionUid}. NEVER speak this ID.
- [LOG]: Trigger [[ACTION: log_call | uid: ${sessionUid} | name: ... | phone: ... | reason: ...]] when you have gathered basic patient details.
- [BOOK]: Trigger [[ACTION: book_appointment | uid: ${sessionUid} | name: ... | phone: ... | date: ... | reason: ...]] at the end when the appointment is confirmed.

Booking Order: 1. Name -> 2. Phone -> 3. New/Returning -> 4. Reason -> 5. Finalize Slot.

Goal: Make the patient feel comfortable while efficiently handling their request.`);
    }, []);

    const {
        agentState,
        messages,
        errorMsg,
        startListening,
        stopAgent,
        clearHistory
    } = useVoiceAgent({
        systemPrompt,
        model,
        useCloudLLM,
        isContinuous,
        llmProvider: useCloudLLM ? llmProvider : "ollama" as any
    })

    const displayMessages = messages.filter(m => m.role !== "system")

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, agentState])

    const getOrbAnimation = () => {
        switch (agentState) {
            case "listening": return "animate-[pulse_1.5s_ease-in-out_infinite] scale-110 shadow-[0_0_60px_rgba(34,197,94,0.4)] bg-green-500"
            case "thinking": return "animate-bounce scale-105 shadow-[0_0_40px_rgba(59,130,246,0.3)] bg-blue-500"
            case "speaking": return "animate-[ping_3s_ease-in-out_infinite] scale-105 shadow-[0_0_50px_rgba(var(--primary),0.5)] bg-primary"
            case "error": return "bg-destructive shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            default: return "bg-muted shadow-xl grayscale-[0.5] scale-100 hover:scale-105"
        }
    }

    return (
        <div className="h-full lg:h-[calc(100vh-8rem)] flex flex-col max-w-[1600px] mx-auto px-4 relative overflow-hidden">
            {/* Zen Glow Background */}
            <div className={`absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] transition-colors duration-1000 opacity-10 ${agentState === 'listening' ? 'from-green-500/20' :
                agentState === 'thinking' ? 'from-blue-500/20' :
                    'from-primary/10'
                } via-transparent to-transparent`} />

            {/* Header / Config Bar */}
            <div className="flex justify-between items-center py-4 lg:py-4 shrink-0 px-2">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl lg:text-2xl font-black tracking-tighter text-foreground/90">SHUBH<span className="text-primary">.AI</span></h1>
                    <div className="flex items-center gap-2 bg-muted/40 px-3 py-1 rounded-full border border-border/50">
                        <div className={`h-2 w-2 rounded-full ${agentState !== 'idle' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {agentState === 'idle' ? 'Ready' : agentState}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                        <Zap className="h-3.5 w-3.5 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            {useCloudLLM ? (llmProvider === 'gemini' ? 'Gemini 1.5' : (llmProvider === 'xai' ? 'xAI Grok' : 'Groq LPU')) : 'Local Ollama'}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="rounded-full hover:bg-muted/50 h-10 w-10">
                        <SettingsIcon className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Main Content: 50/50 Split Vertical Layout */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-6 pb-4 lg:pb-6">

                {/* Left Column: Vertical Interaction Section */}
                <div className="flex-[0.6] lg:flex-1 flex flex-col items-center justify-center space-y-6 lg:space-y-10 bg-card/40 backdrop-blur-md rounded-[2rem] lg:rounded-[2.5rem] border border-border/40 relative overflow-hidden group shadow-2xl py-8 lg:py-0">
                    <div className="absolute top-4 lg:top-6 left-6 lg:left-8 flex items-center gap-2 opacity-50">
                        <Activity className="h-3 lg:h-4 w-3 lg:w-4" />
                        <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em]">Live Agent</span>
                    </div>

                    <div className="relative">
                        {agentState !== 'idle' && (
                            <div className="absolute inset-[-20%] rounded-full border-2 border-primary/10 animate-ping duration-1000" />
                        )}

                        <button
                            onClick={agentState === 'idle' ? startListening : stopAgent}
                            className={`h-48 w-48 lg:h-72 lg:w-72 rounded-full transition-all duration-1000 flex items-center justify-center relative z-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] ${getOrbAnimation()}`}
                        >
                            <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                            {agentState === "thinking" && <BrainCircuit className="h-16 w-16 lg:h-24 lg:w-24 text-white animate-pulse" />}
                            {agentState === "listening" && <Mic className="h-16 w-16 lg:h-24 lg:w-24 text-white" />}
                            {agentState === "speaking" && <Activity className="h-16 w-16 lg:h-24 lg:w-24 text-white" />}
                            {agentState === "error" && <AlertCircle className="h-16 w-16 lg:h-24 lg:w-24 text-white" />}
                            {agentState === "idle" && <Mic className="h-16 w-16 lg:h-24 lg:w-24 text-white opacity-80 group-hover:scale-110 transition-transform" />}
                        </button>
                    </div>

                    <div className="text-center space-y-2 lg:space-y-3 px-8">
                        <h2 className="text-2xl lg:text-4xl font-black tracking-tighter text-foreground group-hover:tracking-normal transition-all duration-500">
                            {agentState === 'idle' ? 'Start Call' : agentState === 'listening' ? 'Listening...' : 'Shubh.ai'}
                        </h2>
                        <p className="text-xs lg:text-sm text-muted-foreground font-medium max-w-[280px] leading-relaxed">
                            {agentState === 'idle' ? 'Shubh is ready to assist your patients.' : 'Conversation in progress...'}
                        </p>
                    </div>

                    <div className="h-16 flex items-center justify-center">
                        {agentState !== 'idle' && (
                            <Button variant="destructive" size="lg" onClick={stopAgent} className="rounded-full px-12 h-14 font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all group bg-red-600 hover:bg-red-500 border-none">
                                <Square className="h-4 w-4 mr-3 fill-current group-hover:scale-90 transition-transform" />
                                End Session
                            </Button>
                        )}
                        {agentState === 'idle' && (
                            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground/40 animate-pulse tracking-widest">
                                <RefreshCw className="h-3 w-3" />
                                Waiting for connection
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Full Vertical Conversation Log */}
                <div className="flex-1 flex flex-col bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-border/40 overflow-hidden shadow-2xl relative">
                    <div className="p-6 flex items-center justify-between border-b border-border/30 bg-card/60 px-8">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/60">Transcript</h2>
                                <p className="text-[10px] text-muted-foreground font-bold">{displayMessages.length} Messages total</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={clearHistory} className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth custom-scrollbar bg-slate-500/5">
                        {displayMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                                <div className="h-24 w-24 rounded-[2rem] bg-muted/50 flex items-center justify-center border-2 border-dashed border-border/50">
                                    <Database className="h-10 w-10" />
                                </div>
                                <div className="space-y-2">
                                    <p className="font-black uppercase text-xs tracking-[0.3em]">No Transcript Yet</p>
                                    <p className="text-xs max-w-[220px] mx-auto font-medium leading-relaxed">Start speaking to see the live conversation appear here in real-time.</p>
                                </div>
                            </div>
                        ) : (
                            displayMessages.map((msg, idx) => (
                                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[85%] rounded-[2rem] px-7 py-5 text-sm shadow-xl transition-all ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-tr-none shadow-primary/20'
                                        : 'bg-background text-foreground rounded-tl-none border border-border/40 shadow-slate-200/50'
                                        }`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`text-[10px] uppercase font-black tracking-widest ${msg.role === 'user' ? 'opacity-70' : 'text-primary'}`}>
                                                {msg.role === 'user' ? 'PATIENT' : 'SHUBH'}
                                            </span>
                                            <span className="text-[10px] opacity-40 tabular-nums font-bold">
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-base leading-relaxed font-semibold">
                                            {msg.content}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                        {/* Status for thinking */}
                        {agentState === 'thinking' && (
                            <div className="flex flex-col items-start animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="bg-background rounded-[1.5rem] rounded-tl-none px-6 py-4 border border-border/40 shadow-lg">
                                    <div className="flex gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 rounded-full bg-primary animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Message Toast-like */}
            {errorMsg && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground text-xs font-bold px-8 py-4 rounded-full shadow-[0_20px_50px_-10px_rgba(239,68,68,0.5)] flex items-center gap-4 animate-in slide-in-from-bottom-12">
                    <AlertCircle className="h-5 w-5" />
                    {errorMsg}
                    <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="h-6 px-3 bg-white/20 hover:bg-white/30 rounded-full text-[10px] uppercase font-black">Retry</Button>
                </div>
            )}

            {/* Settings Overlay */}
            {showSettings && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowSettings(false)} />
                    <Card className="w-full max-w-xl relative z-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border-primary/20 animate-in zoom-in-95 duration-300 overflow-hidden rounded-[3rem]">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-blue-500 to-purple-600" />
                        <CardContent className="p-10 space-y-10 pt-14">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black tracking-tight">AI Settings</h3>
                                    <p className="text-muted-foreground text-sm font-medium">Configure Shubh's underlying intelligence.</p>
                                </div>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/80 h-10 w-10" onClick={() => setShowSettings(false)}>
                                    <X className="h-6 w-6" />
                                </Button>
                            </div>

                            <div className="grid gap-8">
                                <div className="space-y-4">
                                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.3em] pl-1 text-center">Backend Provider</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => { setUseCloudLLM(true); setLlmProvider('gemini'); }}
                                            className={`p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-3 ${useCloudLLM && llmProvider === 'gemini'
                                                ? 'border-primary bg-primary/5 shadow-2xl ring-4 ring-primary/10'
                                                : 'border-border/60 hover:border-primary/40'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <BrainCircuit className={`h-6 w-6 ${useCloudLLM && llmProvider === 'gemini' ? 'text-primary' : 'text-muted-foreground'}`} />
                                                {useCloudLLM && llmProvider === 'gemini' && <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-lg">Gemini 1.5</p>
                                                <p className="text-[11px] text-muted-foreground font-bold">Best Free Multilingual</p>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => { setUseCloudLLM(true); setLlmProvider('xai'); }}
                                            className={`p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-3 ${useCloudLLM && llmProvider === 'xai'
                                                ? 'border-primary bg-primary/5 shadow-2xl ring-4 ring-primary/10'
                                                : 'border-border/60 hover:border-primary/40'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <Zap className={`h-6 w-6 ${useCloudLLM && llmProvider === 'xai' ? 'text-primary' : 'text-muted-foreground'}`} />
                                                {useCloudLLM && llmProvider === 'xai' && <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-lg">xAI Grok</p>
                                                <p className="text-[11px] text-muted-foreground font-bold">Premium Multilingual</p>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            onClick={() => { setUseCloudLLM(true); setLlmProvider('groq'); }}
                                            className={`p-6 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-3 ${useCloudLLM && llmProvider === 'groq'
                                                ? 'border-primary bg-primary/5 shadow-2xl ring-4 ring-primary/10'
                                                : 'border-border/60 hover:border-primary/40'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <Activity className={`h-6 w-6 ${useCloudLLM && llmProvider === 'groq' ? 'text-primary' : 'text-muted-foreground'}`} />
                                                {useCloudLLM && llmProvider === 'groq' && <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-lg">Groq LPU</p>
                                                <p className="text-[11px] text-muted-foreground font-bold">Ultra Low Latency</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-8 border-t border-border/30">
                                    <div className="flex items-center justify-between bg-muted/30 p-5 rounded-3xl border border-border/50">
                                        <div className="space-y-1">
                                            <p className="text-base font-black">Local Offline Mode</p>
                                            <p className="text-xs text-muted-foreground font-semibold">Run on your machine via Ollama</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="h-6 w-6 rounded-lg accent-primary cursor-pointer"
                                            checked={!useCloudLLM}
                                            onChange={(e) => setUseCloudLLM(!e.target.checked)}
                                        />
                                    </div>

                                    {!useCloudLLM && (
                                        <div className="animate-in slide-in-from-top-4 duration-500">
                                            <label className="text-[11px] font-black uppercase text-muted-foreground tracking-widest block mb-3 pl-2">Select Ollama Model</label>
                                            <Select value={model} onChange={(e: any) => setModel(e.target.value)} className="h-14 rounded-2xl font-bold border-2">
                                                <option value="qwen2.5:7b">Qwen 2.5 (7b)</option>
                                                <option value="llama3.1">Llama 3.1</option>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/20 flex items-start gap-4 shadow-inner">
                                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Activity className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black uppercase text-primary tracking-[0.2em]">Active Voice Engine</p>
                                            <p className="text-lg font-black mt-1">Shubh (Bulbul:v3)</p>
                                            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Premium 48kHz HD Audio</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full h-16 text-xl rounded-[2rem] font-black shadow-2xl hover:scale-[1.02] transition-transform active:scale-95" onClick={() => setShowSettings(false)}>
                                APPLY CHANGES
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
