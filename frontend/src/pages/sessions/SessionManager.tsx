import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Calendar, Clock, PlayCircle, StopCircle } from "lucide-react"
import {
  GetAllChildren,
  GetActiveSession,
  StartSession,
  EndSession,
} from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"
import { SessionView } from "./SessionView"

export function SessionManager() {
  const [children, setChildren] = useState<model.Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)
  const [activeSession, setActiveSession] = useState<model.Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summaryNotes, setSummaryNotes] = useState("")

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      checkActiveSession(selectedChildId)
    } else {
      setActiveSession(null)
    }
  }, [selectedChildId])

  const loadChildren = async () => {
    try {
      setLoading(true)
      const data = await GetAllChildren()
      setChildren(data)
      setError(null)
    } catch (err) {
      console.error("Error loading children:", err)
      setError("Gagal memuat data anak")
    } finally {
      setLoading(false)
    }
  }

  const checkActiveSession = async (childId: number) => {
    try {
      setLoading(true)
      const session = await GetActiveSession(childId)
      setActiveSession(session)
      setError(null)
    } catch (err) {
      console.error("Error checking active session:", err)
      setActiveSession(null)
      // Don't set error here as it's normal not to have an active session
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    if (!selectedChildId) return

    try {
      setLoading(true)
      const newSession = await StartSession(selectedChildId)
      setActiveSession(newSession)
      setError(null)
    } catch (err) {
      console.error("Error starting session:", err)
      setError("Gagal memulai sesi")
    } finally {
      setLoading(false)
    }
  }

  const handleEndSession = async () => {
    if (!activeSession) return

    try {
      setLoading(true)
      await EndSession(activeSession.ID, summaryNotes)
      setActiveSession(null)
      setSummaryNotes("")
      setError(null)
    } catch (err) {
      console.error("Error ending session:", err)
      setError("Gagal mengakhiri sesi")
    } finally {
      setLoading(false)
    }
  }

  const selectedChild = selectedChildId
    ? children.find((c) => c.ID === selectedChildId)
    : null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manajemen Sesi Terapi</h1>
        <div className="text-sm text-muted-foreground">
          <Clock className="inline mr-1" size={16} />
          Saat ini: {new Date().toLocaleString("id-ID")}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Anak</CardTitle>
          <CardDescription>
            Pilih anak untuk memulai atau melanjutkan sesi terapi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !activeSession ? (
            <p>Memuat data...</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : children.length === 0 ? (
            <p>Belum ada data anak. Tambahkan anak terlebih dahulu.</p>
          ) : (
            <div className="space-y-4">
              <select
                value={selectedChildId || ""}
                onChange={(e) =>
                  setSelectedChildId(Number(e.target.value) || null)
                }
                className="w-full border rounded-md p-2"
              >
                <option value="">Pilih anak...</option>
                {children.map((child) => (
                  <option key={child.ID} value={child.ID}>
                    {child.Name} - {child.ParentGuardianName}
                  </option>
                ))}
              </select>

              {selectedChild && !activeSession && (
                <div className="flex justify-end">
                  <button
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md"
                    onClick={handleStartSession}
                    disabled={loading}
                  >
                    <PlayCircle size={16} />
                    <span>Mulai Sesi</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {activeSession && (
        <>
          <SessionView
            session={activeSession}
            childName={selectedChild?.Name || ""}
          />

          <Card className="border-t-4 border-t-red-500">
            <CardHeader>
              <CardTitle>Akhiri Sesi</CardTitle>
              <CardDescription>
                Tambahkan catatan ringkasan sebelum mengakhiri sesi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  placeholder="Tambahkan catatan ringkasan sesi..."
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  className="w-full border rounded-md p-2"
                  rows={4}
                />
                <div className="flex justify-end">
                  <button
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md"
                    onClick={handleEndSession}
                    disabled={loading}
                  >
                    <StopCircle size={16} />
                    <span>Akhiri Sesi</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
