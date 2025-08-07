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
  GetChildActivityFrequency,
  GetChildNoteKeywordFrequency,
  GetChildRewardTrends,
  GetChildRewards,
} from "../../../wailsjs/go/main/App"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import Papa from "papaparse"
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
  const [activityFreq, setActivityFreq] = useState<
    { name: string; count: number }[]
  >([])
  const [keywordFreq, setKeywordFreq] = useState<
    { word: string; count: number }[]
  >([])
  const [rewardTrends, setRewardTrends] = useState<any[]>([])

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      loadProgress(selectedChildId)
      loadSessions(selectedChildId)
      loadRewards(selectedChildId)
      loadActivityFreq(selectedChildId)
      loadKeywordFreq(selectedChildId)
      loadRewardTrends(selectedChildId)
    } else {
      setProgress(null)
      setSessions([])
      setRewards([])
      setActivityFreq([])
      setKeywordFreq([])
      setRewardTrends([]) // Ensure rewardTrends is always an array, not null
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

  const loadActivityFreq = async (childId: number) => {
    try {
      const data = await GetChildActivityFrequency(childId)
      setActivityFreq(
        Object.entries(data).map(([name, count]) => ({ name, count }))
      )
    } catch {}
  }
  const loadKeywordFreq = async (childId: number) => {
    try {
      const data = await GetChildNoteKeywordFrequency(childId)
      setKeywordFreq(
        Object.entries(data)
          .map(([word, count]) => ({ word, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15)
      )
    } catch {}
  }
  const loadRewardTrends = async (childId: number) => {
    try {
      const data = await GetChildRewardTrends(childId)
      setRewardTrends(Array.isArray(data) ? data : []) // Defensive: always set to array
    } catch {
      setRewardTrends([]) // On error, set to empty array
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

  const handleExportPDF = async () => {
    const dashboard = document.getElementById("progress-dashboard-export")
    if (!dashboard) return
    const canvas = await html2canvas(dashboard)
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("p", "mm", "a4")
    const width = pdf.internal.pageSize.getWidth()
    const height = (canvas.height * width) / canvas.width
    pdf.addImage(imgData, "PNG", 0, 0, width, height)
    pdf.save(`progres_${selectedChild?.Name || "anak"}.pdf`)
  }

  const handleExportCSV = () => {
    // Export sessions, rewards, activities as CSV
    const sessionRows = sessions.map((s) => ({
      tanggal: new Date(s.StartTime).toLocaleDateString("id-ID"),
      mulai: new Date(s.StartTime).toLocaleTimeString("id-ID"),
      selesai: s.EndTime ? new Date(s.EndTime).toLocaleTimeString("id-ID") : "",
      durasi: s.EndTime
        ? Math.round(
            (new Date(s.EndTime).getTime() - new Date(s.StartTime).getTime()) /
              60000
          )
        : "",
      catatan: s.SummaryNotes || "",
    }))
    const csv = Papa.unparse(sessionRows)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `sesi_${selectedChild?.Name || "anak"}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
          <div id="progress-dashboard-export">
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
                  <div className="text-xs text-muted-foreground">
                    Total Sesi
                  </div>
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

          {/* Advanced Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Activity Frequency */}
            <Card>
              <CardHeader>
                <CardTitle>Aktivitas Paling Sering</CardTitle>
                <CardDescription>
                  Aktivitas yang paling sering dilakukan anak ini
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityFreq.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Tidak ada data aktivitas
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={activityFreq}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#16a34a" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            {/* Reward Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Tren Reward per Bulan</CardTitle>
                <CardDescription>
                  Jumlah reward yang diberikan setiap bulan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!rewardTrends || rewardTrends.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Tidak ada data reward bulanan
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={Object.values(
                        rewardTrends.reduce((acc, cur) => {
                          const key = `${cur.month}-${cur.type}`
                          acc[key] = {
                            month: cur.month,
                            type: cur.type,
                            total: cur.total,
                          }
                          return acc
                        }, {} as any)
                      )}
                      stackOffset="sign"
                    >
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" fill="#eab308" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Keyword Frequency */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Kata Kunci Catatan Terbanyak</CardTitle>
              <CardDescription>
                Kata yang paling sering muncul di catatan sesi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {keywordFreq.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Tidak ada data kata kunci
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keywordFreq.map((kw) => (
                    <span
                      key={kw.word}
                      className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      style={{
                        fontSize: `${
                          Math.max(1, Math.min(kw.count, 6)) + 0.75
                        }em`,
                      }}
                    >
                      {kw.word} ({kw.count})
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Buttons */}
          <div className="flex gap-2 justify-end mb-2">
            <button
              onClick={handleExportPDF}
              className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Ekspor PDF
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700"
            >
              Ekspor CSV
            </button>
          </div>
        </>
      )}
    </div>
  )
}
