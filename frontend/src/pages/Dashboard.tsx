import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Calendar, Clock, Users, Activity } from "lucide-react"
import { GetAllChildren } from "../../wailsjs/go/main/App"
import { model } from "../../wailsjs/go/models"

export function Dashboard() {
  const [children, setChildren] = useState<model.Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const childrenData = await GetAllChildren()
        setChildren(childrenData)
      } catch (err) {
        console.error("Error loading children:", err)
        setError("Gagal memuat data anak")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const stats = [
    {
      title: "Jumlah Anak",
      value: children.length,
      icon: <Users className="text-blue-500" />,
      description: "Total anak dalam terapi",
    },
    {
      title: "Sesi Aktif",
      value: 0, // You'll need to implement this with a real API call
      icon: <Clock className="text-green-500" />,
      description: "Sesi terapi aktif hari ini",
    },
    {
      title: "Aktivitas Populer",
      value: "Membaca", // You'll need to implement this with a real API call
      icon: <Activity className="text-purple-500" />,
      description: "Berdasarkan frekuensi bulan ini",
    },
    {
      title: "Jadwal Hari Ini",
      value: 3, // You'll need to implement this with a real API call
      icon: <Calendar className="text-orange-500" />,
      description: "Sesi terjadwal hari ini",
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Selamat Datang di Child Sessions</h1>

      {/* Stats */}
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
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Children */}
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Anak Terakhir Ditambahkan</CardTitle>
            <CardDescription>Daftar anak yang baru ditambahkan</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Memuat data...</p>
            ) : error ? (
              <p className="text-destructive">{error}</p>
            ) : children.length === 0 ? (
              <p>Belum ada data anak</p>
            ) : (
              <div className="space-y-2">
                {children.slice(0, 5).map((child) => (
                  <div
                    key={child.ID}
                    className="border rounded-md p-3 flex justify-between"
                  >
                    <div>
                      <p className="font-medium">{child.Name}</p>
                      <p className="text-sm text-muted-foreground">
                        {child.Gender} • {child.ParentGuardianName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
