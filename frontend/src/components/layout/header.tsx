import { Bell, User } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface HeaderProps {
  pageTitle: string
}

export function Header({ pageTitle }: HeaderProps) {
  return (
    <div className="flex items-center justify-between h-full px-2 sm:px-4">
      <div className="flex items-center gap-2">
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold truncate">
          {pageTitle}
        </h2>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button className="p-2 rounded-full hover:bg-accent">
          <Bell size={20} />
        </button>
        <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-accent">
          <User size={20} />
          <span className="hidden sm:inline">Terapis</span>
        </button>
      </div>
    </div>
  )
}
