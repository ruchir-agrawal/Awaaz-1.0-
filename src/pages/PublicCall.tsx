import { useState } from "react";
import { useParams } from "react-router-dom";
import { useVoiceAgent } from "@/hooks/useVoiceAgent";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mic, Square, Activity, BrainCircuit, AlertCircle, PhoneIncoming } from "lucide-react";

export default function PublicCall() {
    const { slug } = useParams();
    const [isStarted, setIsStarted] = useState(false);

    // For the public demo, we hardcode the Dental prompt template
    const current_time_IST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const systemPrompt = `You are Ratan, a friendly voice assistant for Sharmaji Dental Hub. 
    Role: Handle inbound appointments and questions.
    Tone: Warm and casual.
    Current Time: ${current_time_IST}.
    Slug context: ${slug}`;

    const {
        agentState,
        startListening,
        stopAgent,
        errorMsg
    } = useVoiceAgent({
        systemPrompt,
        useCloudLLM: true,
        isContinuous: true
    });

    const getOrbColor = () => {
        switch (agentState) {
            case "listening": return "bg-green-500 shadow-[0_0_40px_rgba(34,197,94,0.6)] scale-110";
            case "thinking": return "bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.6)] animate-pulse";
            case "speaking": return "bg-primary shadow-[0_0_40px_rgba(var(--primary),0.6)] scale-105";
            case "error": return "bg-destructive shadow-[0_0_40px_rgba(239,68,68,0.6)]";
            default: return "bg-muted shadow-lg grayscale";
        }
    };

    if (!isStarted) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
                <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                    <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-8">
                        <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center animate-bounce">
                            <PhoneIncoming className="h-10 w-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold tracking-tight text-white capitalize">{slug?.replace('-', ' ')}</h1>
                            <p className="text-muted-foreground">Voice Assistant is ready to help you.</p>
                        </div>
                        <Button size="lg" className="w-full h-16 text-lg font-semibold rounded-2xl group shadow-2xl transition-all hover:scale-[1.02]" onClick={() => setIsStarted(true)}>
                            <Mic className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                            Start Conversation
                        </Button>
                        <p className="text-xs text-white/30">Standard data rates may apply. Ensure microphone access.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans overflow-hidden">
            <div className={`absolute inset-0 transition-colors duration-1000 ${agentState === 'listening' ? 'bg-green-500/5' :
                agentState === 'thinking' ? 'bg-blue-500/5' :
                    'bg-primary/5'
                }`} />

            <div className="w-full max-w-md flex flex-col items-center gap-12 relative">
                {/* Visualizer Section */}
                <div className="relative flex items-center justify-center h-80 w-80">
                    {/* Ring Animations */}
                    {agentState !== "idle" && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-25" />
                            <div className="absolute inset-8 rounded-full border border-primary/20 animate-[ping_3s_linear_infinite] opacity-20" />
                        </>
                    )}

                    <div className={`h-48 w-48 rounded-full transition-all duration-700 ${getOrbColor()} flex items-center justify-center z-10 overlow-hidden`}>
                        {agentState === "thinking" && <BrainCircuit className="h-16 w-16 text-white animate-pulse" />}
                        {agentState === "listening" && <Mic className="h-16 w-16 text-white animate-pulse" />}
                        {agentState === "speaking" && <Activity className="h-16 w-16 text-white" />}
                        {agentState === "error" && <AlertCircle className="h-16 w-16 text-white" />}
                        {agentState === "idle" && <div className="h-4 w-4 rounded-full bg-white/20 animate-pulse" />}
                    </div>
                </div>

                <div className="text-center space-y-4 z-10 w-full px-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-semibold text-white">
                            {agentState === "listening" ? "Listening..." :
                                agentState === "thinking" ? "Thinking..." :
                                    agentState === "speaking" ? "Ratan Speaking" :
                                        "Connected"}
                        </h2>
                        <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium opacity-60">
                            Sharmaji Dental Hub
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-6 pt-8">
                        {agentState === "idle" || agentState === "error" ? (
                            <Button size="lg" className="rounded-full h-20 w-20 shadow-2xl hover:scale-105 active:scale-95 transition-transform bg-primary" onClick={startListening}>
                                <Mic className="h-8 w-8 text-white" />
                            </Button>
                        ) : (
                            <Button size="lg" variant="destructive" className="rounded-full h-20 w-20 shadow-2xl hover:scale-105 active:scale-95 transition-transform" onClick={stopAgent}>
                                <Square className="h-8 w-8 fill-current" />
                            </Button>
                        )}
                    </div>

                    <Button variant="ghost" className="text-white/40 hover:text-white/60 text-sm mt-4" onClick={() => setIsStarted(false)}>
                        End Call
                    </Button>
                </div>

                {errorMsg && (
                    <div className="absolute bottom-[-60px] max-w-xs p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs text-center animate-in fade-in slide-in-from-bottom-2">
                        {errorMsg}
                    </div>
                )}
            </div>
        </div>
    );
}
