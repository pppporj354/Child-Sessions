import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Plus, Pencil, Trash2, Clock, Search } from "lucide-react"
import {
  GetAllActivities,
  CreateActivity,
  GetActivityByID,
} from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"

export function ActivityLibrary() {
  const [activities, setActivities] = useState<model.Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingActivity, setEditingActivity] = useState<model.Activity | null>(
    null
  )
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState(15)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const data = await GetAllActivities()
      setActivities(data)
      setError(null)
    } catch (err) {
      console.error("Error loading activities:", err)
      setError("Gagal memuat daftar aktivitas")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      if (editingActivity) {
        // Update functionality would go here in a real app
        // await UpdateActivity(editingActivity.ID, name, description, defaultDurationMinutes)
      } else {
        await CreateActivity(name, description, defaultDurationMinutes)
      }

      resetForm()
      loadActivities()
    } catch (err) {
      console.error("Error saving activity:", err)
      setError(
        editingActivity
          ? "Gagal memperbarui aktivitas"
          : "Gagal menambahkan aktivitas baru"
      )
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (id: number) => {
    try {
      setLoading(true)
      const activity = await GetActivityByID(id)
      setEditingActivity(activity)
      setName(activity.Name)
      setDescription(activity.Description)
      setDefaultDurationMinutes(activity.DefaultDurationMinutes)
      setShowAddForm(true)
      setError(null)
    } catch (err) {
      console.error("Error fetching activity details:", err)
      setError("Gagal memuat detail aktivitas")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingActivity(null)
    setName("")
    setDescription("")
    setDefaultDurationMinutes(15)
    setShowAddForm(false)
  }

  const filteredActivities = activities.filter(
    (activity) =>
      activity.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.Description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pustaka Aktivitas Terapi</h1>
        <button
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md"
          onClick={() => setShowAddForm(true)}
          disabled={loading}
        >
          <Plus size={16} />
          <span>Tambah Aktivitas</span>
        </button>
      </div>

      {showAddForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingActivity ? "Edit Aktivitas" : "Tambah Aktivitas Baru"}
            </CardTitle>
            <CardDescription>
              {editingActivity
                ? "Ubah detail aktivitas terapi"
                : "Tambahkan aktivitas baru ke pustaka aktivitas terapi"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  Nama Aktivitas <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border rounded-md p-2"
                  placeholder="Contoh: Membaca Buku"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium"
                >
                  Deskripsi <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full border rounded-md p-2"
                  placeholder="Jelaskan tujuan dan cara melakukan aktivitas ini"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="duration" className="block text-sm font-medium">
                  Durasi Default (menit) <span className="text-red-500">*</span>
                </label>
                <input
                  id="duration"
                  type="number"
                  min={1}
                  max={120}
                  value={defaultDurationMinutes}
                  onChange={(e) =>
                    setDefaultDurationMinutes(parseInt(e.target.value, 10))
                  }
                  required
                  className="w-full border rounded-md p-2"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border rounded-md"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                  disabled={loading || !name || !description}
                >
                  {loading
                    ? "Menyimpan..."
                    : editingActivity
                    ? "Perbarui"
                    : "Simpan"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              className="w-full pl-10 pr-4 py-2 border rounded-md"
              placeholder="Cari aktivitas berdasarkan nama atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
          )}

          {loading ? (
            <p className="text-center py-8">Memuat data aktivitas...</p>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                {searchTerm
                  ? "Tidak ada aktivitas yang cocok dengan pencarian Anda"
                  : "Belum ada aktivitas tersimpan. Tambahkan aktivitas pertama Anda!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredActivities.map((activity) => (
                <Card
                  key={activity.ID}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {activity.Name}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                          <Clock size={14} />
                          <span>{activity.DefaultDurationMinutes} menit</span>
                        </div>
                        <p className="mt-2 text-sm">{activity.Description}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleEdit(activity.ID)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                          disabled={loading}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          // onClick={() => handleDelete(activity.ID)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                          disabled={loading}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
