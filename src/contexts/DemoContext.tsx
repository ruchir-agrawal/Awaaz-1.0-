import { createContext, useContext, useState } from "react"

interface DemoContextType {
    isDemoMode: boolean
    toggleDemoMode: () => void
}

const DemoContext = createContext<DemoContextType>({
    isDemoMode: false,
    toggleDemoMode: () => { },
})

export function DemoProvider({ children }: { children: React.ReactNode }) {
    const [isDemoMode, setIsDemoMode] = useState(false)

    const toggleDemoMode = () => {
        setIsDemoMode((prev) => !prev)
    }

    return (
        <DemoContext.Provider value={{ isDemoMode, toggleDemoMode }}>
            {children}
        </DemoContext.Provider>
    )
}

export const useDemo = () => {
    return useContext(DemoContext)
}
