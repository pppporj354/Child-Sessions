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
  ExportCSVFile,
  ExportPDFFile,
  OpenFileInExplorer,
  ShowNotification,
} from "../../../wailsjs/go/main/App"
import { EventsOn } from "../../../wailsjs/runtime/runtime"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import Papa from "papaparse"
import { toast } from "sonner"
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
import {
  Users,
  Award,
  Clock,
  TrendingUp,
  CheckCircle2,
  Download,
  FileText,
  BarChart3,
  ExternalLink,
  Loader2,
} from "lucide-react"

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
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingCSV, setExportingCSV] = useState(false)

  // Listen for notifications from backend
  useEffect(() => {
    const unsubscribe = EventsOn("notification", (data: any) => {
      if (data.type === "success") {
        toast.success(data.title, {
          description: data.message,
        })
      } else if (data.type === "error") {
        toast.error(data.title, {
          description: data.message,
        })
      } else {
        toast(data.title, {
          description: data.message,
        })
      }
    })

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

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
      setRewardTrends([])
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
      toast.error("Error", {
        description: "Gagal memuat daftar anak",
      })
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
      toast.error("Error", {
        description: "Gagal memuat ringkasan progres",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async (childId: number) => {
    try {
      const data = await GetSessionsByChild(childId)
      setSessions(data)
    } catch (err) {
      console.error("Error loading sessions:", err)
    }
  }

  const loadRewards = async (childId: number) => {
    try {
      const data = await GetChildRewards(childId)
      setRewards(data)
    } catch (err) {
      console.error("Error loading rewards:", err)
    }
  }

  const loadActivityFreq = async (childId: number) => {
    try {
      const data = await GetChildActivityFrequency(childId)
      setActivityFreq(
        Object.entries(data).map(([name, count]) => ({ name, count }))
      )
    } catch (err) {
      console.error("Error loading activity frequency:", err)
    }
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
    } catch (err) {
      console.error("Error loading keyword frequency:", err)
    }
  }

  const loadRewardTrends = async (childId: number) => {
    try {
      const data = await GetChildRewardTrends(childId)
      setRewardTrends(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Error loading reward trends:", err)
      setRewardTrends([])
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
    if (!selectedChild) {
      toast.error("Error", {
        description: "Pilih anak terlebih dahulu",
      })
      return
    }

    try {
      setExportingPDF(true)
      toast.loading("Membuat PDF...", {
        description: "Mohon tunggu, sedang memproses dashboard",
      })

      const dashboard = document.getElementById("progress-dashboard-export")
      if (!dashboard) {
        throw new Error("Dashboard element tidak ditemukan")
      }

      // Capture dashboard as canvas
      const canvas = await html2canvas(dashboard, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: dashboard.scrollWidth,
        height: dashboard.scrollHeight,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")

      // Calculate dimensions to fit A4
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imageWidth = canvas.width
      const imageHeight = canvas.height
      const ratio = Math.min(pageWidth / imageWidth, pageHeight / imageHeight)
      const finalWidth = imageWidth * ratio
      const finalHeight = imageHeight * ratio

      // Center the image on the page
      const xOffset = (pageWidth - finalWidth) / 2
      const yOffset = (pageHeight - finalHeight) / 2

      pdf.addImage(imgData, "PNG", xOffset, yOffset, finalWidth, finalHeight)

      // Convert PDF to bytes
      const pdfBytes = pdf.output("arraybuffer")
      const uint8Array = new Uint8Array(pdfBytes)

      // Use Wails export function
      const filename = `progres_${selectedChild.Name}_${
        new Date().toISOString().split("T")[0]
      }.pdf`
      const savedPath = await ExportPDFFile(
        null,
        Array.from(uint8Array),
        filename
      )

      toast.dismiss()
      toast.success("PDF Berhasil Diekspor!", {
        description: `File disimpan di: ${savedPath}`,
        action: {
          label: "Buka Folder",
          onClick: () => OpenFileInExplorer(null, savedPath),
        },
      })

      // Show system notification
      await ShowNotification(
        "Export Berhasil",
        `PDF progres ${selectedChild.Name} telah disimpan`
      )
    } catch (err) {
      console.error("Error exporting PDF:", err)
      toast.dismiss()
      toast.error("Gagal Ekspor PDF", {
        description: "Terjadi kesalahan saat membuat PDF",
      })
    } finally {
      setExportingPDF(false)
    }
  }

  const handleExportCSV = async () => {
    if (!selectedChild) {
      toast.error("Error", {
        description: "Pilih anak terlebih dahulu",
      })
      return
    }

    try {
      setExportingCSV(true)
      toast.loading("Membuat CSV...", {
        description: "Mengumpulkan data sesi",
      })

      // Prepare comprehensive CSV data
      const csvData = []

      // Add session data
      sessions.forEach((session) => {
        const duration = session.EndTime
          ? Math.round(
              (new Date(session.EndTime).getTime() -
                new Date(session.StartTime).getTime()) /
                60000
            )
          : ""

        csvData.push({
          tipe: "SESI",
          tanggal: new Date(session.StartTime).toLocaleDateString("id-ID"),
          waktu_mulai: new Date(session.StartTime).toLocaleTimeString("id-ID"),
          waktu_selesai: session.EndTime
            ? new Date(session.EndTime).toLocaleTimeString("id-ID")
            : "",
          durasi_menit: duration,
          kategori: "",
          deskripsi: session.SummaryNotes || "",
          nilai: "",
        })
      })

      // Add reward data
      rewards.forEach((reward) => {
        csvData.push({
          tipe: "REWARD",
          tanggal: new Date(reward.Timestamp).toLocaleDateString("id-ID"),
          waktu_mulai: new Date(reward.Timestamp).toLocaleTimeString("id-ID"),
          waktu_selesai: "",
          durasi_menit: "",
          kategori: reward.Type,
          deskripsi: reward.Notes || "",
          nilai: reward.Value,
        })
      })

      // Add activity frequency data
      activityFreq.forEach((activity) => {
        csvData.push({
          tipe: "AKTIVITAS",
          tanggal: "",
          waktu_mulai: "",
          waktu_selesai: "",
          durasi_menit: "",
          kategori: activity.name,
          deskripsi: `Frekuensi aktivitas`,
          nilai: activity.count,
        })
      })

      // Add summary data
      if (progress) {
        csvData.push({
          tipe: "RINGKASAN",
          tanggal: new Date().toLocaleDateString("id-ID"),
          waktu_mulai: "",
          waktu_selesai: "",
          durasi_menit: "",
          kategori: "Total Sesi",
          deskripsi: "Jumlah total sesi",
          nilai: progress.total_sessions,
        })

        csvData.push({
          tipe: "RINGKASAN",
          tanggal: new Date().toLocaleDateString("id-ID"),
          waktu_mulai: "",
          waktu_selesai: "",
          durasi_menit: "",
          kategori: "Sesi Selesai",
          deskripsi: "Jumlah sesi yang diselesaikan",
          nilai: progress.completed_sessions,
        })

        csvData.push({
          tipe: "RINGKASAN",
          tanggal: new Date().toLocaleDateString("id-ID"),
          waktu_mulai: "",
          waktu_selesai: "",
          durasi_menit: "",
          kategori: "Rata-rata Durasi",
          deskripsi: "Rata-rata durasi sesi (menit)",
          nilai: Math.round(progress.avg_duration || 0),
        })
      }

      const csv = Papa.unparse(csvData)
      const filename = `data_${selectedChild.Name}_${
        new Date().toISOString().split("T")[0]
      }.csv`

      // Use Wails export function
      const savedPath = await ExportCSVFile(null, csv, filename)

      toast.dismiss()
      toast.success("CSV Berhasil Diekspor!", {
        description: `File disimpan di: ${savedPath}`,
        action: {
          label: "Buka Folder",
          onClick: () => OpenFileInExplorer(null, savedPath),
        },
      })

      // Show system notification
      await ShowNotification(
        "Export Berhasil",
        `Data CSV ${selectedChild.Name} telah disimpan`
      )
    } catch (err) {
      console.error("Error exporting CSV:", err)
      toast.dismiss()
      toast.error("Gagal Ekspor CSV", {
        description: "Terjadi kesalahan saat membuat CSV",
      })
    } finally {
      setExportingCSV(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp size={24} /> Progres Anak
        </h1>
        <div className="flex items-center gap-4">
          <div className="w-64">
            <select
              className="w-full border rounded-md p-2"
              value={selectedChildId || ""}
              onChange={(e) =>
                setSelectedChildId(Number(e.target.value) || null)
              }
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

          {/* Export Buttons */}
          {selectedChild && (
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                disabled={exportingCSV || loading}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingCSV ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileText size={14} />
                )}
                <span>{exportingCSV ? "Mengekspor..." : "Ekspor CSV"}</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exportingPDF || loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportingPDF ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                <span>{exportingPDF ? "Mengekspor..." : "Ekspor PDF"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
      )}

      {!selectedChild ? (
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>Pilih anak untuk melihat progres</p>
        </div>
      ) : (
        <>
          <div id="progress-dashboard-export" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex flex-col items-center">
                  <Users size={28} className="text-blue-600 mb-2" />
                  <div className="text-2xl font-bold">{selectedChild.Name}</div>
                  <div className="text-xs text-muted-foreground text-center">
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

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <Card>
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
          </div>
        </>
      )}
    </div>
  )
}
