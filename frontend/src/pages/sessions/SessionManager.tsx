import React, { useEffect, useState, useCallback, useRef } from "react"
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
  Wifi,
  WifiOff,
  Timer,
  Activity,
} from "lucide-react"
import {
  GetAllChildren,
  GetActiveSession,
  StartSession,
  EndSession,
  GetSessionProgress,
  UpdateSessionSummaryNotes,
  GenerateSessionSummary,
  AutoPauseInactiveActivities,
} from "../../../wailsjs/go/main/App"
import { EventsOn } from "../../../wailsjs/runtime/runtime"
import { model } from "../../../wailsjs/go/models"
import { SessionView } from "./SessionView"
import { toast } from "sonner"

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

  // Real-time features
  const [isOnline, setIsOnline] = useState(true)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [autoSaveInterval, setAutoSaveInterval] = useState(60) // seconds
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    loadChildren()

    // Listen for real-time session events
    const unsubscribeSessionUpdate = EventsOn(
      "session_updated",
      handleSessionUpdate
    )
    const unsubscribeActivityUpdate = EventsOn(
      "activity_updated",
      handleActivityUpdate
    )

    return () => {
      mountedRef.current = false
      clearAllTimers()
      if (unsubscribeSessionUpdate) unsubscribeSessionUpdate()
      if (unsubscribeActivityUpdate) unsubscribeActivityUpdate()
    }
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      checkActiveSession(selectedChildId)
    } else {
      setActiveSession(null)
      setSessionProgress(null)
      clearAllTimers()
    }
  }, [selectedChildId])

  // Real-time session progress updates
  useEffect(() => {
    if (activeSession && mountedRef.current) {
      startProgressUpdates()
      startDurationTimer()
      startAutoSave()
    } else {
      clearAllTimers()
    }

    return () => clearAllTimers()
  }, [activeSession])

  // Auto-save notes
  useEffect(() => {
    if (activeSession && summaryNotes !== (activeSession.SummaryNotes || "")) {
      setUnsavedChanges(true)
    } else {
      setUnsavedChanges(false)
    }
  }, [summaryNotes, activeSession])

  const clearAllTimers = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current)
      durationTimerRef.current = null
    }
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }
  }

  const startProgressUpdates = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current)

    progressTimerRef.current = setInterval(() => {
      if (activeSession && mountedRef.current) {
        loadSessionProgress(activeSession.ID)
      }
    }, 10000) // Every 10 seconds for real-time feel
  }

  const startDurationTimer = () => {
    if (durationTimerRef.current) clearInterval(durationTimerRef.current)

    durationTimerRef.current = setInterval(() => {
      if (activeSession && mountedRef.current) {
        const now = new Date()
        const start = new Date(activeSession.StartTime)
        const durationMs = now.getTime() - start.getTime()
        setSessionDuration(Math.floor(durationMs / 1000))
      }
    }, 1000) // Every second for live duration
  }

  const startAutoSave = () => {
    if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)

    autoSaveTimerRef.current = setInterval(() => {
      if (activeSession && unsavedChanges && mountedRef.current) {
        handleAutoSaveNotes()
      }
    }, autoSaveInterval * 1000)
  }

  const handleSessionUpdate = useCallback(
    (data: any) => {
      console.log("Session update received:", data)
      if (activeSession && data.session_id === activeSession.ID) {
        loadSessionProgress(activeSession.ID)
        toast.info("Sesi Diperbarui", {
          description: "Data sesi telah diperbarui secara real-time",
        })
      }
    },
    [activeSession]
  )

  const handleActivityUpdate = useCallback(
    (data: any) => {
      console.log("Activity update received:", data)
      if (activeSession && mountedRef.current) {
        loadSessionProgress(activeSession.ID)
      }
    },
    [activeSession]
  )

  const handleAutoSaveNotes = async () => {
    if (!activeSession || !unsavedChanges) return

    try {
      await UpdateSessionSummaryNotes(activeSession.ID, summaryNotes)
      setLastAutoSave(new Date())
      setUnsavedChanges(false)
      // Don't show toast for auto-save to avoid spam
    } catch (err) {
      console.error("Auto-save failed:", err)
      setIsOnline(false)
    }
  }

  const loadChildren = async () => {
    try {
      setLoading(true)
      const data = await GetAllChildren()
      setChildren(data)
      setError(null)
      setIsOnline(true)
    } catch (err) {
      console.error("Error loading children:", err)
      setError("Gagal memuat data anak")
      setIsOnline(false)
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

        // Calculate initial duration
        const now = new Date()
        const start = new Date(session.StartTime)
        const durationMs = now.getTime() - start.getTime()
        setSessionDuration(Math.floor(durationMs / 1000))
      }
      setError(null)
      setIsOnline(true)
    } catch (err) {
      console.error("Error checking active session:", err)
      setActiveSession(null)
      setSessionProgress(null)
      setIsOnline(false)
    } finally {
      setLoading(false)
    }
  }

  const loadSessionProgress = async (sessionId: number) => {
    try {
      const progress = await GetSessionProgress(sessionId)
      if (mountedRef.current) {
        setSessionProgress(progress)
        setIsOnline(true)
      }
    } catch (err) {
      console.error("Error loading session progress:", err)
      setIsOnline(false)
    }
  }

  const handleStartSession = async () => {
    if (!selectedChildId) return

    try {
      setLoading(true)
      const newSession = await StartSession(selectedChildId)
      setActiveSession(newSession)
      setSummaryNotes("")
      setSessionDuration(0)
      setError(null)
      setIsOnline(true)

      toast.success("Sesi Dimulai", {
        description: `Sesi terapi untuk ${
          children.find((c) => c.ID === selectedChildId)?.Name
        } telah dimulai`,
      })

      // Emit event to update dashboard
      // EventsEmit is not available in frontend, but backend will handle this
    } catch (err) {
      console.error("Error starting session:", err)
      setError("Gagal memulai sesi")
      setIsOnline(false)
      toast.error("Gagal Memulai Sesi", {
        description: "Terjadi kesalahan saat memulai sesi terapi",
      })
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

      // Auto-populate summary notes if empty
      if (!summaryNotes.trim() && summary.formatted_summary) {
        setSummaryNotes(summary.formatted_summary)
        setUnsavedChanges(true)
      }

      toast.success("Ringkasan Dibuat", {
        description:
          "Ringkasan otomatis telah dibuat berdasarkan aktivitas sesi",
      })
    } catch (err) {
      console.error("Error generating summary:", err)
      toast.error("Gagal Membuat Ringkasan", {
        description: "Terjadi kesalahan saat membuat ringkasan otomatis",
      })
    } finally {
      setLoadingQuickSummary(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!activeSession) return

    try {
      await UpdateSessionSummaryNotes(activeSession.ID, summaryNotes)
      setLastAutoSave(new Date())
      setUnsavedChanges(false)
      toast.success("Catatan Tersimpan", {
        description: "Catatan ringkasan telah disimpan",
      })
    } catch (err) {
      console.error("Error saving notes:", err)
      toast.error("Gagal Menyimpan", {
        description: "Terjadi kesalahan saat menyimpan catatan",
      })
    }
  }

  const handleEndSession = async () => {
    if (!activeSession) return

    try {
      setLoading(true)

      // Auto-save notes before ending
      if (unsavedChanges) {
        await UpdateSessionSummaryNotes(activeSession.ID, summaryNotes)
      }

      // Auto-pause long-running activities
      await AutoPauseInactiveActivities(activeSession.ID, 120) // 2 hours max

      await EndSession(activeSession.ID, summaryNotes)
      setActiveSession(null)
      setSessionProgress(null)
      setShowEndConfirmation(false)
      clearAllTimers()

      toast.success("Sesi Berakhir", {
        description: "Sesi terapi telah berakhir dan data tersimpan",
      })

      // Refresh dashboard stats
      loadSessionProgress(activeSession.ID)
    } catch (err) {
      console.error("Error ending session:", err)
      toast.error("Gagal Mengakhiri Sesi", {
        description: "Terjadi kesalahan saat mengakhiri sesi",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  const selectedChild = children.find((c) => c.ID === selectedChildId)

  return (
    <div className="space-y-6">
      {/* Header with Real-time Status */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar size={24} /> Manajemen Sesi Terapi
        </h1>

        <div className="flex items-center space-x-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-1 text-xs">
            {isOnline ? (
              <Wifi className="w-3 h-3 text-green-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-500" />
            )}
            <span className={isOnline ? "text-green-600" : "text-red-600"}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

          {/* Auto-save Status */}
          {activeSession && (
            <div className="flex items-center space-x-1 text-xs">
              <FileText className="w-3 h-3 text-blue-500" />
              <span
                className={
                  unsavedChanges ? "text-orange-600" : "text-green-600"
                }
              >
                {unsavedChanges ? "Belum tersimpan" : "Tersimpan"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Live Session Timer */}
      {activeSession && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Timer className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    Sesi Aktif - {selectedChild?.Name}
                  </p>
                  <p className="text-sm text-green-600">
                    Dimulai:{" "}
                    {new Date(activeSession.StartTime).toLocaleTimeString(
                      "id-ID"
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-700">
                  {formatDuration(sessionDuration)}
                </p>
                <p className="text-xs text-green-600">
                  {sessionProgress?.active_activities || 0} aktivitas aktif
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Child Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih Anak untuk Sesi Terapi</CardTitle>
          <CardDescription>
            Pilih anak yang akan menjalani sesi terapi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Pilih Anak
              </label>
              <select
                className="w-full border rounded-md p-2"
                value={selectedChildId || ""}
                onChange={(e) =>
                  setSelectedChildId(Number(e.target.value) || null)
                }
                disabled={loading || !!activeSession}
              >
                <option value="">Pilih anak...</option>
                {children.map((child) => (
                  <option key={child.ID} value={child.ID}>
                    {child.Name} ({child.Gender})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              {!activeSession ? (
                <button
                  onClick={handleStartSession}
                  disabled={!selectedChildId || loading}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayCircle size={16} />
                  <span>{loading ? "Memulai..." : "Mulai Sesi"}</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleGenerateQuickSummary}
                    disabled={loadingQuickSummary}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <TrendingUp size={14} />
                    <span>
                      {loadingQuickSummary ? "Membuat..." : "Ringkasan"}
                    </span>
                  </button>

                  <button
                    onClick={() => setShowEndConfirmation(true)}
                    className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700"
                  >
                    <StopCircle size={14} />
                    <span>Akhiri Sesi</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Progress Cards */}
      {activeSession && sessionProgress && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Durasi Sesi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {formatDuration(sessionDuration)}
              </p>
              <p className="text-xs text-muted-foreground">
                Dimulai{" "}
                {new Date(activeSession.StartTime).toLocaleTimeString("id-ID")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Aktivitas Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {sessionProgress.active_activities || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {sessionProgress.completed_activities || 0} selesai
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Aktivitas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                {sessionProgress.total_activities || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {sessionProgress.total_activity_time || 0} menit total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session Content */}
      {activeSession && (
        <SessionView
          session={activeSession}
          childName={selectedChild?.Name || ""}
          onSessionUpdate={() => loadSessionProgress(activeSession.ID)}
        />
      )}

      {/* Session Notes */}
      {activeSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Catatan Ringkasan Sesi</span>
              <div className="flex items-center space-x-2 text-sm">
                {lastAutoSave && (
                  <span className="text-muted-foreground">
                    Tersimpan: {lastAutoSave.toLocaleTimeString("id-ID")}
                  </span>
                )}
                <button
                  onClick={handleSaveNotes}
                  disabled={!unsavedChanges}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  Simpan
                </button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              placeholder="Tulis catatan ringkasan sesi di sini..."
              className="w-full h-32 border rounded-md p-3 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {unsavedChanges
                ? "⚠️ Ada perubahan yang belum tersimpan"
                : "✅ Semua perubahan tersimpan"}
              {autoSaveInterval > 0 && (
                <span> • Auto-save setiap {autoSaveInterval} detik</span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* End Session Confirmation Modal */}
      {showEndConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="text-orange-500" />
                <span>Konfirmasi Akhiri Sesi</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Apakah Anda yakin ingin mengakhiri sesi untuk{" "}
                <strong>{selectedChild?.Name}</strong>?
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Durasi sesi: {formatDuration(sessionDuration)}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleEndSession}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? "Mengakhiri..." : "Ya, Akhiri Sesi"}
                </button>
                <button
                  onClick={() => setShowEndConfirmation(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                >
                  Batal
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Summary Modal */}
      {showQuickSummary && quickSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Ringkasan Sesi Otomatis</CardTitle>
              <CardDescription>
                Ringkasan yang dibuat berdasarkan aktivitas dan catatan sesi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Informasi Sesi</h4>
                  <div className="text-sm space-y-1">
                    <p>Anak: {quickSummary.child_name}</p>
                    <p>Durasi: {quickSummary.duration_minutes} menit</p>
                    <p>Total Aktivitas: {quickSummary.total_activities}</p>
                    <p>
                      Aktivitas Selesai: {quickSummary.completed_activities}
                    </p>
                  </div>
                </div>

                {quickSummary.formatted_summary && (
                  <div>
                    <h4 className="font-medium mb-2">Ringkasan Terformat</h4>
                    <pre className="text-sm bg-gray-50 p-3 rounded whitespace-pre-wrap">
                      {quickSummary.formatted_summary}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-6">
                <button
                  onClick={() => {
                    setSummaryNotes(quickSummary.formatted_summary || "")
                    setShowQuickSummary(false)
                    setUnsavedChanges(true)
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Gunakan Ringkasan Ini
                </button>
                <button
                  onClick={() => setShowQuickSummary(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Tutup
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
