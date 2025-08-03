import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, FileText, Edit2, Trash2, Save, X } from "lucide-react"
import {
  AddNote,
  UpdateNote,
  DeleteNote,
  GetAllNoteTemplates,
} from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"

interface NotesSectionProps {
  sessionId: number
  notes: model.Note[]
  loading: boolean
  onNoteAdded: () => void
}

export function NotesSection({
  sessionId,
  notes,
  loading,
  onNoteAdded,
}: NotesSectionProps) {
  const [showAddNote, setShowAddNote] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [category, setCategory] = useState("")
  const [editingNote, setEditingNote] = useState<model.Note | null>(null)
  const [editText, setEditText] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [templates, setTemplates] = useState<model.NoteTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [loadingNotes, setLoadingNotes] = useState(false)
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
      const data = await GetAllNoteTemplates()
      setTemplates(data)
    } catch (err) {
      console.error("Error loading templates:", err)
      // Don't show error for templates as it's not critical
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return

    try {
      setLoadingNotes(true)
      await AddNote(sessionId, noteText.trim(), category)
      setNoteText("")
      setCategory("")
      setSelectedTemplate(null)
      setShowAddNote(false)
      onNoteAdded()
      setError(null)
    } catch (err) {
      console.error("Error adding note:", err)
      setError("Gagal menambahkan catatan")
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleUpdateNote = async (noteId: number) => {
    if (!editText.trim()) return

    try {
      setLoadingNotes(true)
      await UpdateNote(noteId, editText.trim(), editCategory)
      setEditingNote(null)
      setEditText("")
      setEditCategory("")
      onNoteAdded()
      setError(null)
    } catch (err) {
      console.error("Error updating note:", err)
      setError("Gagal memperbarui catatan")
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus catatan ini?"))
      return

    try {
      setLoadingNotes(true)
      await DeleteNote(noteId)
      onNoteAdded()
      setError(null)
    } catch (err) {
      console.error("Error deleting note:", err)
      setError("Gagal menghapus catatan")
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleTemplateSelect = (templateId: number) => {
    const template = templates.find((t) => t.ID === templateId)
    if (template) {
      setNoteText(template.TemplateText)
      setCategory(template.CategoryHint || "")
      setSelectedTemplate(templateId)
    }
  }

  const startEdit = (note: model.Note) => {
    setEditingNote(note)
    setEditText(note.NoteText)
    setEditCategory(note.Category)
  }

  const cancelEdit = () => {
    setEditingNote(null)
    setEditText("")
    setEditCategory("")
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Perilaku: "bg-blue-100 text-blue-800",
      Kemajuan: "bg-green-100 text-green-800",
      Tantangan: "bg-red-100 text-red-800",
      Komunikasi: "bg-purple-100 text-purple-800",
      Motorik: "bg-orange-100 text-orange-800",
      Sosial: "bg-pink-100 text-pink-800",
      Emosi: "bg-yellow-100 text-yellow-800",
      Lainnya: "bg-gray-100 text-gray-800",
    }
    return colors[category] || colors["Lainnya"]
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Catatan Sesi</h3>
        <button
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm"
          onClick={() => setShowAddNote(true)}
          disabled={loadingNotes}
        >
          <Plus size={14} />
          <span>Tambah Catatan</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {showAddNote && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Tambah Catatan Baru</h4>
              <button
                onClick={() => {
                  setShowAddNote(false)
                  setNoteText("")
                  setCategory("")
                  setSelectedTemplate(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            {templates.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Template Catatan (Opsional)
                </label>
                <select
                  value={selectedTemplate || ""}
                  onChange={(e) => {
                    const templateId = Number(e.target.value)
                    if (templateId) {
                      handleTemplateSelect(templateId)
                    } else {
                      setSelectedTemplate(null)
                      setNoteText("")
                      setCategory("")
                    }
                  }}
                  className="w-full border rounded-md p-2 text-sm"
                >
                  <option value="">Pilih template...</option>
                  {templates.map((template) => (
                    <option key={template.ID} value={template.ID}>
                      {template.TemplateText.substring(0, 50)}...
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
              <label className="block text-sm font-medium">
                Catatan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Tulis catatan tentang sesi ini..."
                className="w-full border rounded-md p-2"
                rows={4}
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddNote(false)
                  setNoteText("")
                  setCategory("")
                  setSelectedTemplate(null)
                }}
                className="px-4 py-2 border rounded-md text-sm"
                disabled={loadingNotes}
              >
                Batal
              </button>
              <button
                onClick={handleAddNote}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm"
                disabled={!noteText.trim() || loadingNotes}
              >
                <Save size={14} />
                <span>Simpan Catatan</span>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-center py-4 text-muted-foreground">
          Memuat catatan sesi...
        </p>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="space-y-2">
            <FileText size={32} className="mx-auto opacity-50" />
            <p>Belum ada catatan dalam sesi ini</p>
            <p className="text-sm">
              Klik "Tambah Catatan" untuk membuat catatan pertama
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.ID} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                {editingNote?.ID === note.ID ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Kategori
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full border rounded-md p-2 text-sm"
                      >
                        <option value="">Pilih kategori...</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full border rounded-md p-2"
                      rows={3}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 border rounded text-sm"
                        disabled={loadingNotes}
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => handleUpdateNote(note.ID)}
                        className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded text-sm"
                        disabled={!editText.trim() || loadingNotes}
                      >
                        <Save size={12} />
                        <span>Simpan</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        {note.Category && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(
                              note.Category
                            )}`}
                          >
                            {note.Category}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.Timestamp).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => startEdit(note)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          disabled={loadingNotes}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.ID)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          disabled={loadingNotes}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {note.NoteText}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
