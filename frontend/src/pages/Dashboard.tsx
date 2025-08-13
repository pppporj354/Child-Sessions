import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Calendar, Clock, Users, Activity, RefreshCw } from "lucide-react"
import { GetAllChildren, GetDashboardStats } from "../../wailsjs/go/main/App"
import { model } from "../../wailsjs/go/models"

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

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadChildren(), loadDashboardStats()])
    } catch (err) {
      console.error("Error loading initial data:", err)
      setError("Gagal memuat data dashboard")
    } finally {
      setLoading(false)
    }
  }

  const loadChildren = async () => {
    try {
      const childrenData = await GetAllChildren()
      setChildren(childrenData)
    } catch (err) {
      console.error("Error loading children:", err)
      throw new Error("Gagal memuat data anak")
    }
  }

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true)
      const stats = await GetDashboardStats()
      setDashboardStats(stats as DashboardStats)
      setError(null)
    } catch (err) {
      console.error("Error loading dashboard stats:", err)
      // Don't throw error here, just log it and use fallback values
      setDashboardStats({
        total_children: children.length,
        active_sessions: 0,
        popular_activity: "Tidak ada data",
        today_sessions: 0,
        last_updated: new Date().toLocaleString("id-ID"),
      })
    } finally {
      setStatsLoading(false)
    }
  }

  const handleRefreshStats = async () => {
    await loadDashboardStats()
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Selamat Datang di Child Sessions</h1>

        {/* Refresh Button */}
        <button
          onClick={handleRefreshStats}
          disabled={statsLoading}
          className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`w-4 h-4 ${statsLoading ? "animate-spin" : ""}`}
          />
          <span>{statsLoading ? "Memperbarui..." : "Perbarui Data"}</span>
        </button>
      </div>

      {/* Last Updated Info */}
      {dashboardStats?.last_updated && (
        <div className="text-xs text-muted-foreground">
          Terakhir diperbarui:{" "}
          {new Date(dashboardStats.last_updated).toLocaleString("id-ID")}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
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
