import { Bell, User } from "lucide-react"

interface HeaderProps {
  pageTitle: string
}

export function Header({ pageTitle }: HeaderProps) {
  return (
    <div className="flex items-center justify-between h-full px-4">
      <h2 className="text-xl font-semibold">{pageTitle}</h2>
      <div className="flex items-center space-x-4">
        <button className="p-2 rounded-full hover:bg-accent">
          <Bell size={20} />
        </button>
        <button className="flex items-center space-x-2 p-2 rounded-full hover:bg-accent">
          <User size={20} />
          <span>Terapis</span>
        </button>
      </div>
    </div>
  )
}
