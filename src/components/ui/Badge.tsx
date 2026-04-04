import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                {
                    "border-transparent bg-primary-600 text-white hover:bg-primary-700": variant === "default",
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
                    "border-transparent bg-red-500 text-white hover:bg-red-600": variant === "destructive",
                    "border-transparent bg-success-500 text-white hover:bg-success-600": variant === "success",
                    "border-transparent bg-warning-500 text-warning-900 hover:bg-warning-600": variant === "warning",
                    "text-foreground": variant === "outline"
                },
                className
            )}
            {...props}
        />
    )
}

export { Badge }
