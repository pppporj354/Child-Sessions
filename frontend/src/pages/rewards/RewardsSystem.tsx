import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Award,
  Search,
  Star,
  Gift,
  Trophy,
  User,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import {
  GetAllChildren,
  GetChildRewards,
  GetRewardSummary,
} from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"
import { EventsOn } from "../../../wailsjs/runtime/runtime"
import { toast } from "sonner"
import { Plus, Trash2, X } from "lucide-react"

// Catatan: Halaman ini menampilkan riwayat reward per anak dan memungkinkan penambahan/penghapusan reward.

export function RewardsSystem() {
  const [children, setChildren] = useState<model.Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)
  const [childRewards, setChildRewards] = useState<model.Reward[]>([])
  const [rewardSummary, setRewardSummary] = useState<any | null>(null)
  const [loadingAction, setLoadingAction] = useState(false)
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean
  }>({
    overview: true,
    history: false,
    analytics: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State untuk tambah reward dari halaman ini (opsional, tanpa sesi)
  const [showAddReward, setShowAddReward] = useState(false)
  const [rewardType, setRewardType] = useState("")
  const [rewardValue, setRewardValue] = useState(1)
  const [rewardNotes, setRewardNotes] = useState("")

  useEffect(() => {
    loadChildren()
  }, [])

  useEffect(() => {
    if (selectedChildId) {
      loadChildRewards(selectedChildId)
      loadRewardSummary(selectedChildId)
    } else {
      setChildRewards([])
      setRewardSummary(null)
    }
  }, [selectedChildId])

  // Dengarkan event reward_updated agar data segar secara real-time
  useEffect(() => {
    const unsubReward = EventsOn("reward_updated", (data: any) => {
      if (!selectedChildId) return
      // Refresh hanya jika terkait anak terpilih
      if (data && Number(data.child_id) === Number(selectedChildId)) {
        loadChildRewards(selectedChildId)
        loadRewardSummary(selectedChildId)
      }
    })

    const unsubChildAdded = EventsOn("child_added", () => {
      loadChildren()
    })

    return () => {
      if (unsubReward) unsubReward()
      if (unsubChildAdded) unsubChildAdded()
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
      console.error("Error loading children:", err)
      setError("Gagal memuat daftar anak")
    } finally {
      setLoading(false)
    }
  }

  const loadChildRewards = async (childId: number) => {
    try {
      setLoading(true)
      const data = await GetChildRewards(childId)
      setChildRewards(data)
      setError(null)
    } catch (err) {
      console.error("Error loading child rewards:", err)
      setError("Gagal memuat data reward anak")
    } finally {
      setLoading(false)
    }
  }

  const loadRewardSummary = async (childId: number) => {
    try {
      setLoading(true)
      const data = await GetRewardSummary(childId)
      setRewardSummary(data)
      setError(null)
    } catch (err) {
      console.error("Error loading reward summary:", err)
      setError("Gagal memuat ringkasan reward")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReward = async (rewardId: number) => {
    try {
      setLoadingAction(true)
      const { DeleteReward } = await import("../../../wailsjs/go/main/App")
      await DeleteReward(rewardId)
      toast.success("Reward dihapus")
      if (selectedChildId) {
        await loadChildRewards(selectedChildId)
        await loadRewardSummary(selectedChildId)
      }
    } catch (err) {
      console.error("Gagal menghapus reward:", err)
      toast.error("Gagal menghapus reward")
    } finally {
      setLoadingAction(false)
    }
  }

  const handleOpenAdd = () => {
    if (!selectedChildId) {
      toast.error("Pilih anak terlebih dahulu")
      return
    }
    setShowAddReward(true)
  }

  const handleSubmitAddReward = async () => {
    if (!selectedChildId || !rewardType) return
    try {
      setLoadingAction(true)
      const { AddReward } = await import("../../../wailsjs/go/main/App")
      // Tidak terkait sesi: kirim null sebagai sessionID
      await AddReward(
        selectedChildId,
        null as any,
        rewardType,
        rewardValue,
        rewardNotes
      )
      toast.success("Reward ditambahkan")
      setShowAddReward(false)
      setRewardType("")
      setRewardValue(1)
      setRewardNotes("")
      await loadChildRewards(selectedChildId)
      await loadRewardSummary(selectedChildId)
    } catch (err) {
      console.error("Gagal menambah reward:", err)
      toast.error("Gagal menambah reward")
    } finally {
      setLoadingAction(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "Sticker":
        return <Star className="text-yellow-500" size={16} />
      case "Bintang":
        return <Trophy className="text-blue-500" size={16} />
      case "Poin":
        return <Award className="text-green-500" size={16} />
      case "Hadiah Kecil":
        return <Gift className="text-purple-500" size={16} />
      default:
        return <Award className="text-gray-500" size={16} />
    }
  }

  const getRewardColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Sticker: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Bintang: "bg-blue-100 text-blue-800 border-blue-200",
      Poin: "bg-green-100 text-green-800 border-green-200",
      "Hadiah Kecil": "bg-purple-100 text-purple-800 border-purple-200",
    }
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  // Group rewards by month
  const groupedRewards = childRewards.reduce((acc, reward) => {
    const date = new Date(reward.Timestamp)
    const monthYear = `${date.toLocaleString("id-ID", {
      month: "long",
    })} ${date.getFullYear()}`

    if (!acc[monthYear]) {
      acc[monthYear] = []
    }

    acc[monthYear].push(reward)
    return acc
  }, {} as { [key: string]: model.Reward[] })

  const selectedChild = children.find((child) => child.ID === selectedChildId)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sistem Reward</h1>
        <div className="flex-shrink-0 w-64">
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

      {loading && !selectedChild ? (
        <p className="text-center py-8">Memuat data...</p>
      ) : !selectedChild ? (
        <p className="text-center py-8 text-muted-foreground">
          Pilih anak untuk melihat data reward
        </p>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <User size={18} />
                    <span>{selectedChild.Name}</span>
                  </CardTitle>
                  <CardDescription>
                    Manajemen reward dan statistik pencapaian
                  </CardDescription>
                </div>
                <button
                  className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm"
                  onClick={handleOpenAdd}
                  disabled={loading}
                >
                  <Award size={14} />
                  <span>Beri Reward</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {showAddReward && (
                <div className="border rounded-md p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Tambah Reward</h4>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setShowAddReward(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm mb-1">Jenis Reward</label>
                      <select
                        className="w-full border rounded-md p-2"
                        value={rewardType}
                        onChange={(e) => setRewardType(e.target.value)}
                      >
                        <option value="">Pilih...</option>
                        <option>Sticker</option>
                        <option>Bintang</option>
                        <option>Poin</option>
                        <option>Hadiah Kecil</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Jumlah/Nilai</label>
                      <input
                        type="number"
                        className="w-full border rounded-md p-2"
                        min={1}
                        value={rewardValue}
                        onChange={(e) => setRewardValue(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Catatan</label>
                      <input
                        type="text"
                        className="w-full border rounded-md p-2"
                        placeholder="Opsional"
                        value={rewardNotes}
                        onChange={(e) => setRewardNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-3 space-x-2">
                    <button
                      className="px-3 py-1 border rounded-md text-sm"
                      onClick={() => setShowAddReward(false)}
                      disabled={loadingAction}
                    >
                      Batal
                    </button>
                    <button
                      className="px-3 py-1 rounded-md text-sm bg-green-600 text-white"
                      onClick={handleSubmitAddReward}
                      disabled={!rewardType || loadingAction}
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              )}
              {/* Rewards Overview */}
              <div className="border-b pb-2">
                <button
                  className="flex w-full items-center justify-between py-2"
                  onClick={() => toggleSection("overview")}
                >
                  <h3 className="text-lg font-medium">Ringkasan Reward</h3>
                  {expandedSections.overview ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>

                {expandedSections.overview && rewardSummary && (
                  <div className="py-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Card className="bg-blue-50">
                        <CardContent className="p-3 flex flex-col items-center text-center">
                          <Award className="text-blue-500 mb-1" size={20} />
                          <div className="text-2xl font-bold">
                            {rewardSummary.total_rewards || 0}
                          </div>
                          <div className="text-xs">Total Reward</div>
                        </CardContent>
                      </Card>

                      {rewardSummary.rewards_by_type &&
                        Object.entries(rewardSummary.rewards_by_type).map(
                          ([type, count]) => (
                            <Card key={type} className={getRewardColor(type)}>
                              <CardContent className="p-3 flex flex-col items-center text-center">
                                {getRewardIcon(type)}
                                <div className="text-2xl font-bold">
                                  {String(count)}
                                </div>
                                <div className="text-xs">{type}</div>
                              </CardContent>
                            </Card>
                          )
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* Rewards History */}
              <div className="border-b py-2">
                <button
                  className="flex w-full items-center justify-between py-2"
                  onClick={() => toggleSection("history")}
                >
                  <h3 className="text-lg font-medium">Riwayat Reward</h3>
                  {expandedSections.history ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>

                {expandedSections.history && (
                  <div className="py-2 space-y-4">
                    {Object.keys(groupedRewards).length > 0 ? (
                      Object.entries(groupedRewards)
                        .sort(
                          ([a], [b]) =>
                            new Date(b).getTime() - new Date(a).getTime()
                        )
                        .map(([monthYear, rewards]) => (
                          <div key={monthYear} className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground">
                              {monthYear}
                            </h4>
                            {rewards.map((reward) => (
                              <div
                                key={reward.ID}
                                className="flex items-center justify-between p-2 rounded-md border"
                              >
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`p-2 rounded-full ${getRewardColor(
                                      reward.Type
                                    )} border`}
                                  >
                                    {getRewardIcon(reward.Type)}
                                  </div>
                                  <div>
                                    <p className="font-medium">{reward.Type}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(
                                        reward.Timestamp
                                      ).toLocaleDateString("id-ID")}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className="font-medium">
                                    ×{reward.Value}
                                  </span>
                                  {reward.Notes && (
                                    <span className="text-xs max-w-[150px] truncate">
                                      {reward.Notes}
                                    </span>
                                  )}
                                  <button
                                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                                    title="Hapus Reward"
                                    onClick={() =>
                                      handleDeleteReward(reward.ID)
                                    }
                                    disabled={loadingAction}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))
                    ) : (
                      <p className="text-center py-4 text-muted-foreground">
                        Belum ada riwayat reward untuk anak ini
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Analytics */}
              <div className="py-2">
                <button
                  className="flex w-full items-center justify-between py-2"
                  onClick={() => toggleSection("analytics")}
                >
                  <h3 className="text-lg font-medium">Analisis Pencapaian</h3>
                  {expandedSections.analytics ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </button>

                {expandedSections.analytics && (
                  <div className="py-2">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <p className="text-muted-foreground">
                          Grafik dan analisis mendalam akan tersedia di versi
                          mendatang.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
