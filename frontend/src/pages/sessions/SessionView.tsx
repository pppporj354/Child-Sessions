import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Clock, FileText, Activity as ActivityIcon, Award } from "lucide-react"
import {
  GetSessionActivities,
  GetSessionNotes,
} from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"
import { ActivitySection } from "./ActivitySection"
import { NotesSection } from "./NotesSection"
import { RewardSection } from "./RewardSection"

interface SessionViewProps {
  session: model.Session
  childName: string
}

export function SessionView({ session, childName }: SessionViewProps) {
  const [activeTab, setActiveTab] = useState("activities")
  const [activities, setActivities] = useState<model.SessionActivity[]>([])
  const [notes, setNotes] = useState<model.Note[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      loadActivities()
      loadNotes()
    }
  }, [session])

  const loadActivities = async () => {
    try {
      setLoadingActivities(true)
      const data = await GetSessionActivities(session.ID)
      setActivities(data)
    } catch (err) {
      console.error("Error loading activities:", err)
      setError("Gagal memuat aktivitas")
    } finally {
      setLoadingActivities(false)
    }
  }

  const loadNotes = async () => {
    try {
      setLoadingNotes(true)
      const data = await GetSessionNotes(session.ID)
      setNotes(data)
    } catch (err) {
      console.error("Error loading notes:", err)
      setError("Gagal memuat catatan")
    } finally {
      setLoadingNotes(false)
    }
  }

  // Calculate session duration
  const startTime = new Date(session.StartTime)
  const currentTime = new Date()
  const durationMs = currentTime.getTime() - startTime.getTime()
  const durationMinutes = Math.floor(durationMs / 60000)
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  return (
    <Card className="border-t-4 border-t-green-500">
      <CardHeader>
        <CardTitle>Sesi Aktif: {childName}</CardTitle>
        <CardDescription className="flex items-center space-x-2">
          <Clock size={16} />
          <span>
            Mulai: {startTime.toLocaleString("id-ID")} ({hours}j {minutes}m)
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex border-b">
          <button
            className={`px-4 py-2 ${
              activeTab === "activities"
                ? "border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("activities")}
          >
            <div className="flex items-center space-x-2">
              <ActivityIcon size={16} />
              <span>Aktivitas</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "notes"
                ? "border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("notes")}
          >
            <div className="flex items-center space-x-2">
              <FileText size={16} />
              <span>Catatan</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "rewards"
                ? "border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("rewards")}
          >
            <div className="flex items-center space-x-2">
              <Award size={16} />
              <span>Reward</span>
            </div>
          </button>
        </div>

        {error && <p className="text-destructive">{error}</p>}

        <div className="pt-2">
          {activeTab === "activities" && (
            <ActivitySection
              sessionId={session.ID}
              activities={activities}
              loading={loadingActivities}
              onActivityAdded={loadActivities}
            />
          )}

          {activeTab === "notes" && (
            <NotesSection
              sessionId={session.ID}
              notes={notes}
              loading={loadingNotes}
              onNoteAdded={loadNotes}
            />
          )}

          {activeTab === "rewards" && (
            <RewardSection sessionId={session.ID} childId={session.ChildID} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
