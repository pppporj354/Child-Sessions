import React, { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  FileText,
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  Save,
  X,
} from "lucide-react"
import {
  GetAllNoteTemplates,
  CreateNoteTemplate,
} from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"

export function NotesLibrary() {
  const [templates, setTemplates] = useState<model.NoteTemplate[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTemplate, setEditingTemplate] =
    useState<model.NoteTemplate | null>(null)
  const [templateText, setTemplateText] = useState("")
  const [categoryHint, setCategoryHint] = useState("")
  const [keywords, setKeywords] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    "Perilaku",
    "Kemajuan",
    "Tantangan",
    "Komunikasi",
    "Motorik",
    "Sosial",
    "Emosi",
    "Lainnya",
  ]

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await GetAllNoteTemplates()
      setTemplates(data)
      setError(null)
    } catch (err) {
      console.error("Error loading note templates:", err)
      setError("Gagal memuat template catatan")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      if (editingTemplate) {
        // Update functionality would go here
        // await UpdateNoteTemplate(editingTemplate.ID, templateText, categoryHint, keywords)
      } else {
        await CreateNoteTemplate(templateText, categoryHint, keywords)
      }

      resetForm()
      loadTemplates()
    } catch (err) {
      console.error("Error saving template:", err)
      setError(
        editingTemplate
          ? "Gagal memperbarui template"
          : "Gagal menambahkan template baru"
      )
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingTemplate(null)
    setTemplateText("")
    setCategoryHint("")
    setKeywords("")
    setShowAddForm(false)
  }

  const filteredTemplates = templates.filter(
    (template) =>
      template.TemplateText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.CategoryHint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.Keywords.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pustaka Template Catatan</h1>
        <button
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md"
          onClick={() => setShowAddForm(true)}
          disabled={loading}
        >
          <Plus size={16} />
          <span>Tambah Template</span>
        </button>
      </div>

      {showAddForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingTemplate
                ? "Edit Template Catatan"
                : "Tambah Template Catatan"}
            </CardTitle>
            <CardDescription>
              Template catatan memudahkan pencatatan cepat selama sesi terapi
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
                <label
                  htmlFor="templateText"
                  className="block text-sm font-medium"
                >
                  Teks Template <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="templateText"
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  required
                  rows={5}
                  className="w-full border rounded-md p-2"
                  placeholder="Contoh: Anak menunjukkan kemajuan dalam [area] dengan melakukan [aktivitas]..."
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="categoryHint"
                  className="block text-sm font-medium"
                >
                  Kategori
                </label>
                <select
                  id="categoryHint"
                  value={categoryHint}
                  onChange={(e) => setCategoryHint(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">Pilih kategori...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="keywords" className="block text-sm font-medium">
                  Kata Kunci (pisahkan dengan koma)
                </label>
                <input
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full border rounded-md p-2"
                  placeholder="kemajuan, perilaku, komunikasi, ..."
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
                  disabled={loading || !templateText.trim()}
                >
                  {loading
                    ? "Menyimpan..."
                    : editingTemplate
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
              placeholder="Cari template berdasarkan teks, kategori, atau kata kunci..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
          )}

          {loading ? (
            <p className="text-center py-8">Memuat template catatan...</p>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText
                className="mx-auto text-muted-foreground mb-2"
                size={32}
              />
              <p className="text-lg text-muted-foreground">
                {searchTerm
                  ? "Tidak ada template yang cocok dengan pencarian Anda"
                  : "Belum ada template tersimpan. Tambahkan template pertama Anda!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.ID}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {template.CategoryHint && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {template.CategoryHint}
                            </span>
                          )}
                          {template.Keywords && (
                            <span className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Tag size={12} />
                              <span>{template.Keywords}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">
                          {template.TemplateText}
                        </p>
                      </div>

                      <div className="flex space-x-1 ml-4">
                        <button
                          onClick={() => {
                            setEditingTemplate(template)
                            setTemplateText(template.TemplateText)
                            setCategoryHint(template.CategoryHint)
                            setKeywords(template.Keywords)
                            setShowAddForm(true)
                          }}
                          className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                          disabled={loading}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          // onClick={() => handleDelete(template.ID)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
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
