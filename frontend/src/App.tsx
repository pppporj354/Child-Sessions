import React, { useState } from "react"
import { Layout as AppLayout } from "./components/layout/Layout"
import { AppSidebar } from "./components/layout/sidebar"
import { Header } from "./components/layout/header"
import { Dashboard } from "./pages/Dashboard"
import { SidebarProvider } from "./components/ui/sidebar"
import { ChildrenList } from "./pages/children/ChildrenList"
import { SessionManager } from "./pages/sessions/SessionManager"
import { ActivityLibrary } from "./pages/activities/ActivityLibrary"
import { RewardsSystem } from "./pages/rewards/RewardsSystem"
import { NotesLibrary } from "./pages/notes/NotesLibrary"
import { Settings } from "./pages/Settings"

function App() {
  const [activePage, setActivePage] = useState("dashboard")

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />
      case "children":
        return <ChildrenList />
      case "sessions":
        return <SessionManager />
      case "activities":
        return <ActivityLibrary />
      case "rewards":
        return <RewardsSystem />
      case "notes":
        return <NotesLibrary />
      case "settings":
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <SidebarProvider>
      <AppLayout
        sidebar={
          <AppSidebar activePage={activePage} setActivePage={setActivePage} />
        }
        header={<Header pageTitle={getPageTitle(activePage)} />}
      >
        {renderPage()}
      </AppLayout>
    </SidebarProvider>
  )
}

function getPageTitle(page: string): string {
  switch (page) {
    case "dashboard":
      return "Dashboard"
    case "children":
      return "Manajemen Anak"
    case "sessions":
      return "Sesi Terapi"
    case "activities":
      return "Aktivitas"
    case "rewards":
      return "Sistem Reward"
    case "notes":
      return "Catatan"
    case "settings":
      return "Pengaturan"
    default:
      return "Dashboard"
  }
}

export default App
