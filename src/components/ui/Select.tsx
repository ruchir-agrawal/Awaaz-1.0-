import * as React from "react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, ...props }, ref) => {
        return (
            <select
                ref={ref}
                className={cn(
                    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            />
        )
    }
)
Select.displayName = "Select"

export { Select }

export const SelectTrigger = ({ children, className }: { children?: React.ReactNode; className?: string }) => <div className={className}>{children}</div>
export const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>
export const SelectContent = ({ children }: { children?: React.ReactNode }) => <>{children}</>
export const SelectItem = ({ children, value }: { children?: React.ReactNode; value: string | number }) => <option value={value}>{children}</option>
