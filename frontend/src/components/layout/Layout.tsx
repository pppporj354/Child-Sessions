import React from "react"
import { cn } from "@/lib/utils"

interface LayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  header: React.ReactNode
  className?: string
}

export function Layout({ children, sidebar, header, className }: LayoutProps) {
  return (
    <div className={cn("flex h-screen w-full overflow-hidden", className)}>
      <div className="w-64 h-full border-r bg-sidebar text-sidebar-foreground">
        {sidebar}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-16 border-b bg-background">{header}</div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  )
}
