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

export function RewardsSystem() {
  const [children, setChildren] = useState<model.Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null)
  const [childRewards, setChildRewards] = useState<model.Reward[]>([])
  const [rewardSummary, setRewardSummary] = useState<any | null>(null)
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean
  }>({
    overview: true,
    history: false,
    analytics: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
                  // onClick={() => setShowAddReward(true)}
                  disabled={loading}
                >
                  <Award size={14} />
                  <span>Beri Reward</span>
                </button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
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
