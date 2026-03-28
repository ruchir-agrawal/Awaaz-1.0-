import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
    children: React.ReactNode
    content: React.ReactNode
    className?: string
    position?: "top" | "bottom" | "left" | "right"
}

export function Tooltip({ children, content, className, position = "top" }: TooltipProps) {
    return (
        <div className="group relative inline-block">
            {children}
            <div
                className={cn(
                    "invisible absolute z-50 whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs text-background opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 dark:bg-muted dark:text-muted-foreground",
                    {
                        "bottom-full left-1/2 -translate-x-1/2 -translate-y-2": position === "top",
                        "top-full left-1/2 -translate-x-1/2 translate-y-2": position === "bottom",
                        "right-full top-1/2 -translate-x-2 -translate-y-1/2": position === "left",
                        "left-full top-1/2 translate-x-2 -translate-y-1/2": position === "right",
                    },
                    className
                )}
            >
                {content}
                {/* Simple triangle arrow */}
                <div
                    className={cn("absolute h-2 w-2 bg-foreground rotate-45 dark:bg-muted", {
                        "-bottom-1 left-1/2 -translate-x-1/2": position === "top",
                        "-top-1 left-1/2 -translate-x-1/2": position === "bottom",
                        "-right-1 top-1/2 -translate-y-1/2": position === "left",
                        "-left-1 top-1/2 -translate-y-1/2": position === "right",
                    })}
                />
            </div>
        </div>
    )
}
