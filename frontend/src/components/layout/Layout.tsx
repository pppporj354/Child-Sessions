import React from "react"
import { cn } from "@/lib/utils"
import { SidebarInset } from "@/components/ui/sidebar"

interface LayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  header: React.ReactNode
  className?: string
}

export function Layout({ children, sidebar, header, className }: LayoutProps) {
  return (
    <div className={cn("flex min-h-svh w-full overflow-hidden", className)}>
      {sidebar}
      <SidebarInset>
        <div className="h-16 border-b bg-background">{header}</div>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </SidebarInset>
    </div>
  )
}
