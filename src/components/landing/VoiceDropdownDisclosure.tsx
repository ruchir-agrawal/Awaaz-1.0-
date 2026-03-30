import { useEffect, useRef, type FC } from "react"
import { ArrowUpRight, Check, ChevronDown, X } from "lucide-react"

export interface VoiceModel {
    id: string
    name: string
    description: string
    image: string
    badge?: string
}

interface VoiceDropdownDisclosureProps {
    voices: VoiceModel[]
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
    selectedVoiceId: string
    onVoiceChange: (voice: VoiceModel) => void
}

function createVoiceArt(primary: string, secondary: string, accent: string) {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none">
      <defs>
        <linearGradient id="g" x1="8" y1="10" x2="82" y2="88" gradientUnits="userSpaceOnUse">
          <stop stop-color="${primary}"/>
          <stop offset="1" stop-color="${secondary}"/>
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="28" fill="url(#g)"/>
      <circle cx="64" cy="28" r="10" fill="${accent}" fill-opacity="0.9"/>
      <path d="M24 72c7-16 18-24 31-24s24 8 31 24" stroke="rgba(255,255,255,0.9)" stroke-width="6" stroke-linecap="round"/>
      <circle cx="48" cy="38" r="17" fill="rgba(255,255,255,0.9)"/>
      <path d="M37 37c2-7 7-11 15-12 6 1 11 5 13 12-5-3-10-4-14-4-4 0-9 1-14 4Z" fill="rgba(18,18,18,0.8)"/>
    </svg>`

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const DEFAULT_VOICES: VoiceModel[] = [
    {
        id: "shubh",
        name: "Shubh",
        description: "Confident premium front desk",
        image: createVoiceArt("#c59046", "#6c3f17", "#f9d58d"),
        badge: "Popular",
    },
    {
        id: "ritu",
        name: "Ritu",
        description: "Warm and reassuring clinic tone",
        image: createVoiceArt("#e29db0", "#6a3759", "#ffd8e3"),
    },
    {
        id: "aditya",
        name: "Aditya",
        description: "Fast, clear and sales-friendly",
        image: createVoiceArt("#81b7ff", "#173e72", "#d6ebff"),
    },
    {
        id: "simran",
        name: "Simran",
        description: "Elegant bilingual hospitality feel",
        image: createVoiceArt("#9ae2d0", "#145449", "#e6fff9"),
    },
]

export const VoiceDropdownDisclosure: FC<VoiceDropdownDisclosureProps> = ({
    voices,
    isOpen,
    onOpenChange,
    selectedVoiceId,
    onVoiceChange,
}) => {
    const selected = voices.find((voice) => voice.id === selectedVoiceId) ?? voices[0]
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!containerRef.current) return
            if (!containerRef.current.contains(event.target as Node)) {
                onOpenChange(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen, onOpenChange])

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => onOpenChange(!isOpen)}
                className="flex h-14 w-full items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 text-left shadow-xl backdrop-blur-xl transition duration-300 hover:bg-white/[0.06]"
            >
                <img src={selected.image} alt={selected.name} className="h-10 w-10 rounded-full border border-white/10 object-cover" />
                <span className="min-w-0 flex-1 truncate text-base font-bold text-white">{selected.name}</span>
                <ChevronDown className={`h-5 w-5 text-white/55 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <div
                className={`absolute left-0 top-[calc(100%+0.85rem)] z-20 w-full origin-top transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isOpen
                        ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                        : "pointer-events-none -translate-y-2 scale-[0.96] opacity-0"
                }`}
            >
                <div className="rounded-[1.8rem] border border-white/10 bg-[#0d0d0d]/96 p-3 shadow-2xl backdrop-blur-2xl">
                    <div className="mb-2 flex items-center justify-between px-2 pt-1">
                        <span className="text-base font-bold text-white/80">Choose Voice</span>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/20"
                            aria-label="Close voice menu"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-1">
                        {voices.map((voice) => {
                            const active = voice.id === selected.id

                            return (
                                <button
                                    key={voice.id}
                                    type="button"
                                    onClick={() => {
                                        onVoiceChange(voice)
                                        onOpenChange(false)
                                    }}
                                    className="group flex items-center justify-between gap-4 rounded-[1rem] px-2 py-3 text-left transition hover:bg-white/[0.05]"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                        <img src={voice.image} alt={voice.name} className="h-11 w-11 rounded-full border border-white/10 object-cover" />

                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[15px] font-bold text-white">{voice.name}</div>
                                            <div className="truncate text-sm text-white/35">{voice.description}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {voice.badge && (
                                            <div className="hidden items-center overflow-hidden rounded-lg border border-white/15 text-xs font-semibold text-white/80 sm:flex">
                                                <div className="border-r border-white/15 px-2 py-1">
                                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                                </div>
                                                <div className="px-2 py-1">{voice.badge}</div>
                                            </div>
                                        )}

                                        <div
                                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                                                active ? "border-white bg-white" : "border-white/15"
                                            }`}
                                        >
                                            {active && <Check className="h-3.5 w-3.5 stroke-[3px] text-black" />}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
