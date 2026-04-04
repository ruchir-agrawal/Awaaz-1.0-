import { useEffect, useMemo, useState, type ButtonHTMLAttributes } from "react"
import { AnimatePresence, MotionConfig, motion } from "framer-motion"
import { CircleCheckBig } from "lucide-react"

import { cn } from "@/lib/utils"

export type SaveToggleStatus = "idle" | "loading" | "success" | "saved"
type Size = "sm" | "md" | "lg"

const SIZE_CONFIG = {
    sm: {
        height: 52,
        circleWidth: 52,
        idleWidth: 108,
        savedWidth: 132,
        text: "text-[18px]",
        icon: "h-6 w-6",
        spinner: "h-7 w-7",
        gap: "gap-2",
        padding: "px-4",
    },
    md: {
        height: 56,
        circleWidth: 56,
        idleWidth: 126,
        savedWidth: 148,
        text: "text-[20px]",
        icon: "h-7 w-7",
        spinner: "h-8 w-8",
        gap: "gap-3",
        padding: "px-5",
    },
    lg: {
        height: 68,
        circleWidth: 68,
        idleWidth: 144,
        savedWidth: 172,
        text: "text-[22px]",
        icon: "h-8 w-8",
        spinner: "h-9 w-9",
        gap: "gap-4",
        padding: "px-5",
    },
} as const

interface SaveToggleProps {
    size?: Size
    idleText?: string
    savedText?: string
    status?: SaveToggleStatus
    defaultStatus?: SaveToggleStatus
    onStatusChange?: (status: SaveToggleStatus) => void
    onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"]
    type?: "button" | "submit" | "reset"
    disabled?: boolean
    className?: string
}

export function SaveToggle({
    size = "md",
    idleText = "Save",
    savedText = "Saved",
    status,
    defaultStatus = "idle",
    onStatusChange,
    onClick,
    type = "button",
    disabled = false,
    className,
}: SaveToggleProps) {
    const [internalStatus, setInternalStatus] = useState<SaveToggleStatus>(defaultStatus)
    const currentStatus = status ?? internalStatus
    const cfg = SIZE_CONFIG[size]
    const stableWidth = useMemo(() => {
        const longestLabel = Math.max(idleText.length, savedText.length)
        const estimatedWidth = longestLabel * (size === "sm" ? 9 : size === "lg" ? 11 : 10) + 48
        return Math.max(cfg.idleWidth, cfg.savedWidth, estimatedWidth)
    }, [cfg.idleWidth, cfg.savedWidth, idleText.length, savedText.length, size])
    const isCircle = currentStatus === "loading" || currentStatus === "success"

    useEffect(() => {
        onStatusChange?.(currentStatus)
    }, [currentStatus, onStatusChange])

    const handleClick: ButtonHTMLAttributes<HTMLButtonElement>["onClick"] = (event) => {
        if (status === undefined && currentStatus === "saved") {
            setInternalStatus("idle")
        }

        onClick?.(event)
    }

    const backgroundColor =
        currentStatus === "loading" || currentStatus === "success"
            ? "#f2efe8"
            : currentStatus === "saved"
                ? "#121212"
                : "rgba(200,160,52,0.08)"

    const borderColor =
        currentStatus === "saved"
            ? "rgba(232,228,221,0.14)"
            : "rgba(200,160,52,0.2)"

    const checkColor = currentStatus === "success" ? "#121212" : "#c8a034"

    return (
        <MotionConfig
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 1,
            }}
        >
            <motion.button
                type={type}
                onClick={handleClick}
                disabled={disabled}
                initial={false}
                animate={{
                    width: isCircle ? cfg.circleWidth : stableWidth,
                    height: cfg.height,
                    backgroundColor,
                }}
                style={{
                    borderWidth: 1,
                    borderColor,
                }}
                transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    mass: 1.2,
                    backgroundColor: {
                        duration: 0.2,
                    },
                }}
                className={cn(
                    "relative z-0 flex items-center justify-center overflow-hidden rounded-full select-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.97]",
                    className,
                )}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {currentStatus === "idle" && (
                        <motion.span
                            key="idle"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15, x: -20 }}
                            className={cn(
                                "absolute inset-0 flex items-center justify-center font-semibold tracking-tight text-[#c8a034]",
                                cfg.text,
                            )}
                        >
                            {idleText}
                        </motion.span>
                    )}

                    {currentStatus === "loading" && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            <motion.svg
                                viewBox="0 0 26 26"
                                className={cfg.spinner}
                                animate={{ rotate: 360 }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 0.7,
                                    ease: "linear",
                                }}
                            >
                                <circle
                                    cx="13"
                                    cy="13"
                                    r="10"
                                    stroke="rgba(18,18,18,0.18)"
                                    strokeWidth="3"
                                    fill="none"
                                />
                                <path
                                    d="M13 3 A10 10 0 0 1 23 13"
                                    stroke="#121212"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </motion.svg>
                        </motion.div>
                    )}

                    {(currentStatus === "success" || currentStatus === "saved") && (
                        <motion.div
                            key={`done-${currentStatus}`}
                            layout
                            initial={
                                currentStatus === "success"
                                    ? { opacity: 0, scale: 0.5, filter: "blur(4px)" }
                                    : { opacity: 1 }
                            }
                            animate={
                                currentStatus === "success"
                                    ? { opacity: 1, scale: 1.15, filter: "blur(0px)" }
                                    : { opacity: 1, scale: 1, y: 0 }
                            }
                            exit={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                            className={cn(
                                "absolute inset-0 flex items-center justify-center",
                                currentStatus === "saved" ? `${cfg.gap} ${cfg.padding}` : "",
                            )}
                        >
                            <motion.div
                                layout
                                animate={{
                                    color: checkColor,
                                }}
                            >
                                <CircleCheckBig className={cn(cfg.icon, "z-20")} />
                            </motion.div>

                            <AnimatePresence mode="wait">
                                {currentStatus === "saved" && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className={cn(
                                            "font-semibold tracking-tight whitespace-nowrap text-[#e8e4dd]",
                                            cfg.text,
                                        )}
                                    >
                                        {savedText}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </MotionConfig>
    )
}
