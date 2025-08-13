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
  Users,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react"
import {
  GetAllChildren,
  GetDashboardStats,
  GetActiveSessions,
} from "../../wailsjs/go/main/App"
import { EventsOn } from "../../wailsjs/runtime/runtime"
import { model } from "../../wailsjs/go/models"
import { toast } from "sonner"

interface DashboardStats {
  total_children: number
  active_sessions: number
  popular_activity: string
  today_sessions: number
  last_updated: string
}

export function Dashboard() {
  const [children, setChildren] = useState<model.Child[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    loadInitialData()

    // Listen for session events from backend
    const unsubscribeSessionStart = EventsOn(
      "session_started",
      handleSessionEvent
    )
    const unsubscribeSessionEnd = EventsOn("session_ended", handleSessionEvent)
    const unsubscribeChildAdded = EventsOn("child_added", handleChildEvent)

    // Cleanup on unmount
    return () => {
      mountedRef.current = false
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
      if (unsubscribeSessionStart) unsubscribeSessionStart()
      if (unsubscribeSessionEnd) unsubscribeSessionEnd()
      if (unsubscribeChildAdded) unsubscribeChildAdded()
    }
  }, [])

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefreshEnabled && refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        if (mountedRef.current) {
          handleAutoRefresh()
        }
      }, refreshInterval * 1000)
    } else {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [autoRefreshEnabled, refreshInterval])

  const handleSessionEvent = useCallback((data: any) => {
    console.log("Session event received:", data)
    // Refresh stats when session events occur
    if (mountedRef.current) {
      loadDashboardStats()
      toast.success("Data Diperbarui", {
        description: "Dashboard telah diperbarui dengan data terbaru",
      })
    }
  }, [])

  const handleChildEvent = useCallback((data: any) => {
    console.log("Child event received:", data)
    // Refresh children list when child is added
    if (mountedRef.current) {
      loadChildren()
      loadDashboardStats()
    }
  }, [])

  const handleAutoRefresh = useCallback(async () => {
    try {
      setIsOnline(true)
      await loadDashboardStats()
      setLastRefresh(new Date())
    } catch (err) {
      console.error("Auto-refresh failed:", err)
      setIsOnline(false)
      // Don't show error toast for auto-refresh failures
    }
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadChildren(), loadDashboardStats()])
      setIsOnline(true)
      setLastRefresh(new Date())
    } catch (err) {
      console.error("Error loading initial data:", err)
      setError("Gagal memuat data dashboard")
      setIsOnline(false)
    } finally {
      setLoading(false)
    }
  }

  const loadChildren = async () => {
    try {
      const childrenData = await GetAllChildren()
      if (mountedRef.current) {
        setChildren(childrenData)
      }
    } catch (err) {
      console.error("Error loading children:", err)
      throw new Error("Gagal memuat data anak")
    }
  }

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true)
      const stats = await GetDashboardStats()

      if (mountedRef.current) {
        setDashboardStats(stats as DashboardStats)
        setError(null)
        setIsOnline(true)
      }
    } catch (err) {
      console.error("Error loading dashboard stats:", err)
      setIsOnline(false)
      // Use fallback values on error
      if (mountedRef.current) {
        setDashboardStats({
          total_children: children.length,
          active_sessions: 0,
          popular_activity: "Tidak ada data",
          today_sessions: 0,
          last_updated: new Date().toLocaleString("id-ID"),
        })
      }
    } finally {
      if (mountedRef.current) {
        setStatsLoading(false)
      }
    }
  }

  const handleManualRefresh = async () => {
    try {
      setStatsLoading(true)
      await loadDashboardStats()
      setLastRefresh(new Date())
      toast.success("Berhasil Diperbarui", {
        description: "Data dashboard telah diperbarui",
      })
    } catch (err) {
      toast.error("Gagal Memperbarui", {
        description: "Terjadi kesalahan saat memperbarui data",
      })
    }
  }

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled)
    toast.info(
      autoRefreshEnabled ? "Auto-refresh Dimatikan" : "Auto-refresh Dinyalakan",
      {
        description: autoRefreshEnabled
          ? "Data tidak akan diperbarui otomatis"
          : `Data akan diperbarui setiap ${refreshInterval} detik`,
      }
    )
  }

  const formatLastRefresh = (date: Date | null) => {
    if (!date) return "Belum pernah"
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)

    if (diffSeconds < 60) return `${diffSeconds} detik yang lalu`
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`
    return date.toLocaleTimeString("id-ID")
  }

  const stats = [
    {
      title: "Jumlah Anak",
      value: dashboardStats?.total_children || children.length,
      icon: <Users className="text-blue-500" />,
      description: "Total anak dalam terapi",
      loading: loading,
    },
    {
      title: "Sesi Aktif",
      value: dashboardStats?.active_sessions || 0,
      icon: <Clock className="text-green-500" />,
      description: "Sesi terapi aktif hari ini",
      loading: loading || statsLoading,
      highlight: (dashboardStats?.active_sessions || 0) > 0,
    },
    {
      title: "Aktivitas Populer",
      value: dashboardStats?.popular_activity || "Memuat...",
      icon: <Activity className="text-purple-500" />,
      description: "Berdasarkan frekuensi bulan ini",
      loading: loading || statsLoading,
    },
    {
      title: "Jadwal Hari Ini",
      value: dashboardStats?.today_sessions || 0,
      icon: <Calendar className="text-orange-500" />,
      description: "Sesi terjadwal hari ini",
      loading: loading || statsLoading,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Selamat Datang di Child Sessions</h1>

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

          {/* Auto-refresh Toggle */}
          <button
            onClick={toggleAutoRefresh}
            className={`text-xs px-2 py-1 rounded ${
              autoRefreshEnabled
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Auto-refresh {autoRefreshEnabled ? "ON" : "OFF"}
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={statsLoading}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 ${statsLoading ? "animate-spin" : ""}`}
            />
            <span>{statsLoading ? "Memperbarui..." : "Perbarui Data"}</span>
          </button>
          {/* <button
            onClick={async () => {
              const count = await GetActiveSessions()
              toast.info("Active Sessions: " + count)
            }}
          >
            Test GetActiveSessions
          </button> */}
        </div>
      </div>

      {/* Last Refresh Info */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div>Terakhir diperbarui: {formatLastRefresh(lastRefresh)}</div>
        {autoRefreshEnabled && (
          <div>Auto-refresh setiap {refreshInterval} detik</div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className={
              stat.highlight ? "ring-2 ring-green-500 bg-green-50" : ""
            }
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.loading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                ) : (
                  stat.value
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Children Section */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Anak Terakhir Ditambahkan</CardTitle>
            <CardDescription>Daftar anak yang baru ditambahkan</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="border rounded-md p-3">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error && children.length === 0 ? (
              <p className="text-destructive">{error}</p>
            ) : children.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada data anak</p>
                <p className="text-sm">
                  Tambahkan anak pertama untuk memulai terapi
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {children
                  .sort(
                    (a, b) =>
                      new Date(b.CreatedAt || 0).getTime() -
                      new Date(a.CreatedAt || 0).getTime()
                  )
                  .slice(0, 5)
                  .map((child) => (
                    <div
                      key={child.ID}
                      className="border rounded-md p-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{child.Name}</p>
                        <p className="text-sm text-muted-foreground">
                          {child.Gender} • {child.ParentGuardianName}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {child.CreatedAt
                          ? new Date(child.CreatedAt).toLocaleDateString(
                              "id-ID"
                            )
                          : ""}
                      </div>
                    </div>
                  ))}

                {children.length > 5 && (
                  <div className="text-center pt-3">
                    <p className="text-sm text-muted-foreground">
                      Dan {children.length - 5} anak lainnya...
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
