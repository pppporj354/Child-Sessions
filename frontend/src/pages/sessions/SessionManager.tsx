import React, { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Calendar,
  Clock,
  PlayCircle,
  StopCircle,
  PauseCircle,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
} from "lucide-react"
import {
  GetAllChildren,
  GetActiveSession,
  StartSession,
  EndSession,
  GetSessionProgress,
  UpdateSessionSummaryNotes,
  GenerateSessionSummary,
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
  const [sessionProgress, setSessionProgress] = useState<any>(null)
  const [showEndConfirmation, setShowEndConfirmation] = useState(false)
  const [showQuickSummary, setShowQuickSummary] = useState(false)
  const [quickSummary, setQuickSummary] = useState<any>(null)
  const [loadingQuickSummary, setLoadingQuickSummary] = useState(false)

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      checkActiveSession(selectedChildId)
    } else {
      setActiveSession(null)
      setSessionProgress(null)
    }
  }, [selectedChildId])

  // Auto-refresh session progress when there's an active session
  useEffect(() => {
    if (activeSession) {
      const interval = setInterval(() => {
        loadSessionProgress(activeSession.ID)
      }, 30000) // Every 30 seconds

      return () => clearInterval(interval)
    }
  }, [activeSession])

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
      if (session) {
        loadSessionProgress(session.ID)
        setSummaryNotes(session.SummaryNotes || "")
      }
      setError(null)
    } catch (err) {
      console.error("Error checking active session:", err)
      setActiveSession(null)
      setSessionProgress(null)
      // Don't set error here as it's normal not to have an active session
    } finally {
      setLoading(false)
    }
  }

  const loadSessionProgress = async (sessionId: number) => {
    try {
      const progress = await GetSessionProgress(sessionId)
      setSessionProgress(progress)
    } catch (err) {
      console.error("Error loading session progress:", err)
    }
  }

  const handleStartSession = async () => {
    if (!selectedChildId) return

    try {
      setLoading(true)
      const newSession = await StartSession(selectedChildId)
      setActiveSession(newSession)
      setSummaryNotes("")
      setError(null)
      // Load initial progress
      loadSessionProgress(newSession.ID)
    } catch (err) {
      console.error("Error starting session:", err)
      setError("Gagal memulai sesi")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateQuickSummary = async () => {
    if (!activeSession) return

    try {
      setLoadingQuickSummary(true)
      const summary = await GenerateSessionSummary(activeSession.ID)
      setQuickSummary(summary)
      setShowQuickSummary(true)
    } catch (err) {
      console.error("Error generating quick summary:", err)
      setError("Gagal membuat ringkasan cepat")
    } finally {
      setLoadingQuickSummary(false)
    }
  }

  const handleUpdateSummaryNotes = async () => {
    if (!activeSession) return

    try {
      await UpdateSessionSummaryNotes(activeSession.ID, summaryNotes)
      // Update the active session with new summary notes
      setActiveSession((prev) =>
        prev
          ? Object.assign(Object.create(Object.getPrototypeOf(prev)), prev, {
              SummaryNotes: summaryNotes,
            })
          : null
      )
    } catch (err) {
      console.error("Error updating summary notes:", err)
      setError("Gagal memperbarui catatan ringkasan")
    }
  }

  const handleEndSession = async () => {
    if (!activeSession) return

    try {
      setLoading(true)
      await EndSession(activeSession.ID, summaryNotes)
      setActiveSession(null)
      setSessionProgress(null)
      setSummaryNotes("")
      setShowEndConfirmation(false)
      setError(null)
    } catch (err) {
      console.error("Error ending session:", err)
      setError("Gagal mengakhiri sesi")
    } finally {
      setLoading(false)
    }
  }

  const handleSessionUpdate = useCallback(() => {
    if (activeSession) {
      loadSessionProgress(activeSession.ID)
    }
  }, [activeSession])

  const selectedChild = selectedChildId
    ? children.find((c) => c.ID === selectedChildId)
    : null

  // Calculate session duration for display
  const getSessionDurationDisplay = () => {
    if (!activeSession) return ""

    const startTime = new Date(activeSession.StartTime)
    const currentTime = new Date()
    const durationMs = currentTime.getTime() - startTime.getTime()
    const durationMinutes = Math.floor(durationMs / 60000)
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60

    if (hours > 0) {
      return `${hours}j ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manajemen Sesi Terapi</h1>
        <div className="text-sm text-muted-foreground">
          <Clock className="inline mr-1" size={16} />
          Saat ini: {new Date().toLocaleString("id-ID")}
        </div>
      </div>

      {/* Child Selection Card */}
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
                disabled={loading}
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
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                    onClick={handleStartSession}
                    disabled={loading}
                  >
                    <PlayCircle size={16} />
                    <span>{loading ? "Memulai..." : "Mulai Sesi"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Progress Overview */}
      {activeSession && sessionProgress && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">
                  Sesi Berlangsung: {selectedChild?.Name}
                </CardTitle>
                <CardDescription>
                  Durasi: {getSessionDurationDisplay()} • Mulai:{" "}
                  {new Date(activeSession.StartTime).toLocaleTimeString(
                    "id-ID"
                  )}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleGenerateQuickSummary}
                  disabled={loadingQuickSummary}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  <TrendingUp size={14} />
                  <span>
                    {loadingQuickSummary ? "Membuat..." : "Lihat Progress"}
                  </span>
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-md">
                <div className="text-2xl font-bold text-blue-700">
                  {sessionProgress.total_activities || 0}
                </div>
                <div className="text-sm text-blue-600">Total Aktivitas</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-md">
                <div className="text-2xl font-bold text-orange-700">
                  {sessionProgress.active_activities || 0}
                </div>
                <div className="text-sm text-orange-600">
                  Sedang Berlangsung
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-md">
                <div className="text-2xl font-bold text-green-700">
                  {sessionProgress.completed_activities || 0}
                </div>
                <div className="text-sm text-green-600">Selesai</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-md">
                <div className="text-2xl font-bold text-purple-700">
                  {Math.round(sessionProgress.total_activity_time || 0)}
                </div>
                <div className="text-sm text-purple-600">Menit Aktivitas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session View */}
      {activeSession && (
        <SessionView
          session={activeSession}
          childName={selectedChild?.Name || ""}
          onSessionUpdate={handleSessionUpdate}
        />
      )}

      {/* End Session Card */}
      {activeSession && (
        <Card className="border-t-4 border-t-red-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <StopCircle size={20} className="text-red-600" />
              <span>Akhiri Sesi</span>
            </CardTitle>
            <CardDescription>
              Tambahkan catatan ringkasan sebelum mengakhiri sesi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Catatan Ringkasan Sesi
                </label>
                <textarea
                  placeholder="Tambahkan catatan ringkasan sesi terapi ini..."
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  onBlur={handleUpdateSummaryNotes}
                  className="w-full border rounded-md p-3"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Catatan akan disimpan otomatis saat Anda berhenti mengetik
                </p>
              </div>

              {!showEndConfirmation ? (
                <div className="flex justify-between">
                  <button
                    onClick={handleGenerateQuickSummary}
                    disabled={loadingQuickSummary}
                    className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                  >
                    <FileText size={16} />
                    <span>
                      {loadingQuickSummary ? "Membuat..." : "Lihat Ringkasan"}
                    </span>
                  </button>
                  <button
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    onClick={() => setShowEndConfirmation(true)}
                    disabled={loading}
                  >
                    <StopCircle size={16} />
                    <span>Akhiri Sesi</span>
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle size={16} className="text-red-600" />
                    <span className="font-medium text-red-800">
                      Konfirmasi Akhiri Sesi
                    </span>
                  </div>
                  <p className="text-sm text-red-700 mb-4">
                    Apakah Anda yakin ingin mengakhiri sesi ini? Pastikan semua
                    aktivitas telah diselesaikan dan catatan telah lengkap.
                  </p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowEndConfirmation(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                      disabled={loading}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleEndSession}
                      className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
                      disabled={loading}
                    >
                      <StopCircle size={14} />
                      <span>
                        {loading ? "Mengakhiri..." : "Ya, Akhiri Sesi"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Summary Modal */}
      {showQuickSummary && quickSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Progress Sesi Saat Ini</h3>
              <button
                onClick={() => setShowQuickSummary(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-md">
                    <div className="text-xl font-bold text-blue-700">
                      {quickSummary.duration_minutes}m
                    </div>
                    <div className="text-sm text-blue-600">Durasi Sesi</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-md">
                    <div className="text-xl font-bold text-green-700">
                      {quickSummary.completed_activities}/
                      {quickSummary.total_activities}
                    </div>
                    <div className="text-sm text-green-600">
                      Aktivitas Selesai
                    </div>
                  </div>
                </div>

                {quickSummary.activities_summary &&
                  quickSummary.activities_summary.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Aktivitas Terbaru:</h4>
                      <div className="space-y-2">
                        {quickSummary.activities_summary
                          .slice(-3)
                          .map((activity: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <span className="font-medium">
                                {activity.name}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  activity.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {activity.status === "completed"
                                  ? "Selesai"
                                  : "Berlangsung"}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowQuickSummary(false)}
                className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
