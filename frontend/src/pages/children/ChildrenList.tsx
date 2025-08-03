import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Search, Plus, Trash, Edit } from "lucide-react"
import { GetAllChildren, DeleteChild } from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"
import { ChildForm } from "./ChildForm"

export function ChildrenList() {
  const [children, setChildren] = useState<model.Child[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedChild, setSelectedChild] = useState<model.Child | null>(null)

  useEffect(() => {
    loadChildren()
  }, [])

  const loadChildren = async () => {
    try {
      setLoading(true)
      const data = await GetAllChildren()
      setChildren(data)
      setError(null)
    } catch (err) {
      console.error("Error loading children:", err)
      setError("Gagal memuat data anak")
    } finally {
      setLoading(false)
    }
  }

  const filteredChildren = children.filter(
    (child) =>
      child.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.ParentGuardianName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteChild = async (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data anak ini?")) {
      try {
        await DeleteChild(id)
        loadChildren()
      } catch (err) {
        console.error("Error deleting child:", err)
        setError("Gagal menghapus data anak")
      }
    }
  }

  const handleEditChild = (child: model.Child) => {
    setSelectedChild(child)
    setShowAddForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manajemen Anak</h1>
        <button
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md"
          onClick={() => {
            setSelectedChild(null)
            setShowAddForm(true)
          }}
        >
          <Plus size={16} />
          <span>Tambah Anak</span>
        </button>
      </div>

      {showAddForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedChild ? "Edit Data Anak" : "Tambah Anak Baru"}
            </CardTitle>
            <CardDescription>
              {selectedChild
                ? "Ubah informasi anak dalam sistem"
                : "Masukkan informasi anak baru ke sistem"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChildForm
              child={selectedChild}
              onSuccess={() => {
                setShowAddForm(false)
                loadChildren()
              }}
              onCancel={() => setShowAddForm(false)}
            />
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
              placeholder="Cari berdasarkan nama anak atau orang tua..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-center py-8">Memuat data anak...</p>
          ) : error ? (
            <p className="text-destructive text-center py-8">{error}</p>
          ) : filteredChildren.length === 0 ? (
            <p className="text-center py-8">
              {searchTerm
                ? "Tidak ada anak yang cocok dengan pencarian"
                : "Belum ada data anak"}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredChildren.map((child) => (
                <Card key={child.ID}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{child.Name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {child.Gender} • Orang tua: {child.ParentGuardianName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Kontak: {child.ContactInfo}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditChild(child)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteChild(child.ID)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                      >
                        <Trash size={18} />
                      </button>
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
