import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { model } from "../../../wailsjs/go/models"
import {
  GetAllChildren,
  GetChildProgressSummary,
  GetSessionsByChild,
  GetChildRewards,
} from "../../../wailsjs/go/main/App"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Users, Award, Clock, TrendingUp, CheckCircle2 } from "lucide-react"

const COLORS = [
  "#2563eb", // blue-600
  "#16a34a", // green-600
  "#f59e42", // orange-400
  "#eab308", // yellow-500
  "#a21caf", // purple-800
  "#dc2626", // red-600
]

export function ChildProgressDashboard() {
  const [children, setChildren] = useState<model.Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)
  const [progress, setProgress] = useState<any>(null)
  const [sessions, setSessions] = useState<model.Session[]>([])
  const [rewards, setRewards] = useState<model.Reward[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      loadProgress(selectedChildId)
      loadSessions(selectedChildId)
      loadRewards(selectedChildId)
    } else {
      setProgress(null)
      setSessions([])
      setRewards([])
    }
  }, [selectedChildId])

  const loadChildren = async () => {
    try {
      setLoading(true)
      const data = await GetAllChildren()
      setChildren(data)
      if (data.length > 0 && !selectedChildId) {
        setSelectedChildId(data[0].ID)
      }
      setError(null)
    } catch (err) {
      setError("Gagal memuat daftar anak")
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async (childId: number) => {
    try {
      setLoading(true)
      const data = await GetChildProgressSummary(childId)
      setProgress(data)
      setError(null)
    } catch (err) {
      setError("Gagal memuat ringkasan progres")
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async (childId: number) => {
    try {
      const data = await GetSessionsByChild(childId)
      setSessions(data)
    } catch (err) {
      // ignore
    }
  }

  const loadRewards = async (childId: number) => {
    try {
      const data = await GetChildRewards(childId)
      setRewards(data)
    } catch (err) {
      // ignore
    }
  }

  // Prepare data for charts
  const sessionDurations = sessions
    .filter((s) => s.EndTime)
    .map((s) => ({
      tanggal: new Date(s.StartTime).toLocaleDateString("id-ID"),
      durasi: Math.round(
        (new Date(s.EndTime!).getTime() - new Date(s.StartTime).getTime()) /
          60000
      ),
    }))

  const rewardTypes = progress?.reward_summary?.rewards_by_type
    ? Object.entries(progress.reward_summary.rewards_by_type).map(
        ([type, count], i) => ({
          name: type,
          value: Number(count),
          color: COLORS[i % COLORS.length],
        })
      )
    : []

  const goalsData = [
    {
      name: "Tercapai",
      value: progress?.achieved_goals || 0,
      color: "#16a34a",
    },
    {
      name: "Belum Tercapai",
      value: (progress?.total_goals || 0) - (progress?.achieved_goals || 0),
      color: "#dc2626",
    },
  ]

  const selectedChild = children.find((c) => c.ID === selectedChildId)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp size={24} /> Progres Anak
        </h1>
        <div className="w-64">
          <select
            className="w-full border rounded-md p-2"
            value={selectedChildId || ""}
            onChange={(e) => setSelectedChildId(Number(e.target.value) || null)}
            disabled={loading}
          >
            <option value="">Pilih anak...</option>
            {children.map((child) => (
              <option key={child.ID} value={child.ID}>
                {child.Name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
      )}

      {!selectedChild ? (
        <div className="text-center py-12 text-muted-foreground">
          Pilih anak untuk melihat progres
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <Users size={28} className="text-blue-600 mb-2" />
                <div className="text-2xl font-bold">{selectedChild.Name}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedChild.Gender} • {selectedChild.ParentGuardianName}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <Clock size={28} className="text-green-600 mb-2" />
                <div className="text-2xl font-bold">
                  {progress?.total_sessions || 0}
                </div>
                <div className="text-xs text-muted-foreground">Total Sesi</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <CheckCircle2 size={28} className="text-purple-600 mb-2" />
                <div className="text-2xl font-bold">
                  {progress?.completed_sessions || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Sesi Selesai
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <Award size={28} className="text-yellow-600 mb-2" />
                <div className="text-2xl font-bold">
                  {progress?.reward_summary?.total_rewards || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Reward
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Session Duration Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Durasi Sesi</CardTitle>
                <CardDescription>
                  Grafik durasi setiap sesi (menit)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessionDurations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Belum ada data sesi selesai
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={sessionDurations}>
                      <XAxis dataKey="tanggal" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="durasi" fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Reward Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribusi Reward</CardTitle>
                <CardDescription>
                  Proporsi reward berdasarkan tipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rewardTypes.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Belum ada data reward
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={rewardTypes}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {rewardTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Goals Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Progres Tujuan Terapi</CardTitle>
                <CardDescription>
                  Jumlah tujuan yang tercapai vs belum tercapai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={goalsData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {goalsData.map((entry, index) => (
                        <Cell key={`cell-goal-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Rata-rata Durasi Sesi</CardTitle>
                <CardDescription>
                  Rata-rata waktu sesi selesai (menit)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-4xl font-bold text-blue-700">
                    {progress?.avg_duration
                      ? Math.round(progress.avg_duration)
                      : 0}
                  </span>
                  <span className="text-muted-foreground mt-2">
                    menit per sesi
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
