import React, { useState } from "react"
import { CreateChild, UpdateChild } from "../../../wailsjs/go/main/App"
import { model } from "../../../wailsjs/go/models"

interface ChildFormProps {
  child: model.Child | null
  onSuccess: () => void
  onCancel: () => void
}

export function ChildForm({ child, onSuccess, onCancel }: ChildFormProps) {
  const [name, setName] = useState(child?.Name || "")
  const [gender, setGender] = useState(child?.Gender || "")
  const [parentGuardianName, setParentGuardianName] = useState(
    child?.ParentGuardianName || ""
  )
  const [contactInfo, setContactInfo] = useState(child?.ContactInfo || "")
  const [initialAssessment, setInitialAssessment] = useState(
    child?.InitialAssessment || ""
  )
  const [dateOfBirth, setDateOfBirth] = useState(
    child?.DateOfBirth?.toString().split("T")[0] || ""
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (child) {
        // Update existing child
        await UpdateChild(
          child.ID,
          name,
          gender,
          parentGuardianName,
          contactInfo,
          initialAssessment
        )
      } else {
        // Create new child
        await CreateChild(
          name,
          gender,
          parentGuardianName,
          contactInfo,
          initialAssessment,
          dateOfBirth
        )
      }
      onSuccess()
    } catch (err) {
      console.error("Error saving child:", err)
      setError(
        child ? "Gagal memperbarui data anak" : "Gagal menambahkan anak baru"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-md">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">
            Nama Anak <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="gender" className="block text-sm font-medium">
            Jenis Kelamin <span className="text-red-500">*</span>
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
            className="w-full border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Pilih jenis kelamin</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="dateOfBirth" className="block text-sm font-medium">
            Tanggal Lahir
          </label>
          <input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="parentGuardianName"
            className="block text-sm font-medium"
          >
            Nama Orang Tua / Wali <span className="text-red-500">*</span>
          </label>
          <input
            id="parentGuardianName"
            value={parentGuardianName}
            onChange={(e) => setParentGuardianName(e.target.value)}
            required
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="contactInfo" className="block text-sm font-medium">
            Informasi Kontak <span className="text-red-500">*</span>
          </label>
          <input
            id="contactInfo"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            required
            placeholder="Nomor telepon / email"
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="initialAssessment"
          className="block text-sm font-medium"
        >
          Penilaian Awal
        </label>
        <textarea
          id="initialAssessment"
          value={initialAssessment}
          onChange={(e) => setInitialAssessment(e.target.value)}
          rows={4}
          className="w-full border rounded-md px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm border rounded-md"
          disabled={loading}
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md"
          disabled={loading}
        >
          {loading ? "Menyimpan..." : child ? "Perbarui" : "Simpan"}
        </button>
      </div>
    </form>
  )
}
