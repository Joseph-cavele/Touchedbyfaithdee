"use client"

import { createContext, useContext, useState } from "react"

interface DashboardNavContextValue {
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
}

const DashboardNavContext = createContext<DashboardNavContextValue | null>(null)

export function DashboardNavProvider({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <DashboardNavContext.Provider value={{ mobileNavOpen, setMobileNavOpen }}>
      {children}
    </DashboardNavContext.Provider>
  )
}

export function useDashboardNav() {
  const ctx = useContext(DashboardNavContext)
  if (!ctx) {
    throw new Error("useDashboardNav must be used within a DashboardNavProvider")
  }
  return ctx
}
