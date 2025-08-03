import React, { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Settings as SettingsIcon,
  Database,
  Bell,
  FileText,
  Save,
} from "lucide-react"

export function Settings() {
  // These settings are placeholders for now - they would connect to backend in a full implementation
  const [dbPath, setDbPath] = useState("therapy_sessions.db")
  const [backupEnabled, setBackupEnabled] = useState(true)
  const [backupInterval, setBackupInterval] = useState("daily")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [sessionReminders, setSessionReminders] = useState(true)
  const [exportFormat, setExportFormat] = useState("pdf")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()

    // Simulating saving settings
    setLoading(true)
    setSuccess(null)

    // Fake delay to simulate saving
    await new Promise((resolve) => setTimeout(resolve, 500))

    setLoading(false)
    setSuccess("Pengaturan berhasil disimpan!")

    // Clear success message after a few seconds
    setTimeout(() => {
      setSuccess(null)
    }, 3000)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan Aplikasi</h1>

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md">
          {success}
        </div>
      )}

      <form onSubmit={handleSaveSettings}>
        {/* Database Settings */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database size={18} />
              <span>Pengaturan Database</span>
            </CardTitle>
            <CardDescription>Konfigurasi database dan backup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="dbPath" className="block text-sm font-medium">
                  Lokasi File Database
                </label>
                <input
                  id="dbPath"
                  value={dbPath}
                  onChange={(e) => setDbPath(e.target.value)}
                  className="w-full border rounded-md p-2"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Lokasi default database SQLite. Untuk mengubah ini, restart
                  aplikasi dengan parameter berbeda.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="backupEnabled"
                  checked={backupEnabled}
                  onChange={(e) => setBackupEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="backupEnabled" className="text-sm font-medium">
                  Aktifkan Backup Otomatis
                </label>
              </div>

              {backupEnabled && (
                <div className="space-y-2">
                  <label
                    htmlFor="backupInterval"
                    className="block text-sm font-medium"
                  >
                    Interval Backup
                  </label>
                  <select
                    id="backupInterval"
                    value={backupInterval}
                    onChange={(e) => setBackupInterval(e.target.value)}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="hourly">Setiap Jam</option>
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications Settings */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell size={18} />
              <span>Pengaturan Notifikasi</span>
            </CardTitle>
            <CardDescription>
              Konfigurasi notifikasi dan pengingat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notificationsEnabled"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label
                  htmlFor="notificationsEnabled"
                  className="text-sm font-medium"
                >
                  Aktifkan Notifikasi
                </label>
              </div>

              {notificationsEnabled && (
                <div className="pl-6 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sessionReminders"
                      checked={sessionReminders}
                      onChange={(e) => setSessionReminders(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="sessionReminders" className="text-sm">
                      Pengingat Sesi
                    </label>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Export Settings */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText size={18} />
              <span>Pengaturan Ekspor</span>
            </CardTitle>
            <CardDescription>Konfigurasi format ekspor laporan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label
                htmlFor="exportFormat"
                className="block text-sm font-medium"
              >
                Format Ekspor Default
              </label>
              <select
                id="exportFormat"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="pdf">PDF</option>
                <option value="docx">Microsoft Word (DOCX)</option>
                <option value="csv">CSV</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Other Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon size={18} />
              <span>Pengaturan Umum</span>
            </CardTitle>
            <CardDescription>Pengaturan umum aplikasi</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pengaturan lanjutan akan tersedia di versi mendatang.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md"
            disabled={loading}
          >
            <Save size={16} />
            <span>{loading ? "Menyimpan..." : "Simpan Pengaturan"}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
