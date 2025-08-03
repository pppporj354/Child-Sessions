import React, { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  X,
  Download,
  Copy,
  Clock,
  Activity,
  FileText,
  Award,
  CheckCircle2,
  Play,
} from "lucide-react"

interface SessionSummaryModalProps {
  summary: any
  isOpen: boolean
  onClose: () => void
  onSave: (summaryNotes: string) => void
}

export function SessionSummaryModal({
  summary,
  isOpen,
  onClose,
  onSave,
}: SessionSummaryModalProps) {
  const [summaryNotes, setSummaryNotes] = useState(summary.summary_notes || "")
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(summaryNotes)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard
      .writeText(summary.formatted_summary)
      .then(() => {
        // Show success notification
        console.log("Ringkasan disalin ke clipboard")
      })
      .catch((err) => {
        console.error("Gagal menyalin ke clipboard:", err)
      })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}j ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Ringkasan Sesi Terapi</h2>
            <p className="text-sm text-muted-foreground">
              {summary.child_name} -{" "}
              {new Date(summary.start_time).toLocaleDateString("id-ID")}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-700"
            >
              <Copy size={14} />
              <span>Salin</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-blue-600 mb-2">
                    <Clock size={20} />
                  </div>
                  <div className="text-2xl font-bold">
                    {formatDuration(summary.duration_minutes)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Durasi Total
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
                    <Activity size={20} />
                  </div>
                  <div className="text-2xl font-bold">
                    {summary.total_activities}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Aktivitas
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-purple-600 mb-2">
                    <FileText size={20} />
                  </div>
                  <div className="text-2xl font-bold">
                    {summary.total_notes}
                  </div>
                  <div className="text-sm text-muted-foreground">Catatan</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-2 text-yellow-600 mb-2">
                    <Award size={20} />
                  </div>
                  <div className="text-2xl font-bold">
                    {summary.total_rewards || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Reward
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activities Summary */}
            {summary.activities_summary &&
              summary.activities_summary.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity size={18} />
                      <span>
                        Aktivitas ({summary.completed_activities}/
                        {summary.total_activities} selesai)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {summary.activities_summary.map(
                        (activity: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                          >
                            <div className="flex items-center space-x-3">
                              {activity.status === "completed" ? (
                                <CheckCircle2
                                  size={16}
                                  className="text-green-600"
                                />
                              ) : (
                                <Play size={16} className="text-orange-600" />
                              )}
                              <div>
                                <div className="font-medium">
                                  {activity.name}
                                </div>
                                {activity.notes && (
                                  <div className="text-sm text-muted-foreground">
                                    {activity.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {activity.duration > 0 &&
                                formatDuration(activity.duration)}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Notes by Category */}
            {summary.notes_by_category &&
              Object.keys(summary.notes_by_category).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText size={18} />
                      <span>Catatan Observasi</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(summary.notes_by_category).map(
                        ([category, notes]: [string, any]) => (
                          <div key={category}>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">
                              {category}:
                            </h4>
                            <div className="space-y-1">
                              {notes.map((note: any, index: number) => (
                                <div
                                  key={index}
                                  className="text-sm bg-gray-50 p-2 rounded"
                                >
                                  • {note.NoteText}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Rewards Summary */}
            {summary.rewards_by_type &&
              Object.keys(summary.rewards_by_type).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award size={18} />
                      <span>Reward Diberikan</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(summary.rewards_by_type).map(
                        ([type, count]: [string, any]) => (
                          <div
                            key={type}
                            className="flex items-center justify-between p-3 bg-yellow-50 rounded-md"
                          >
                            <span className="font-medium">{type}</span>
                            <span className="text-lg font-bold text-yellow-600">
                              {count}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Formatted Summary Text */}
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Terformat</CardTitle>
                <CardDescription>
                  Ringkasan siap untuk disalin atau diekspor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md text-sm font-mono overflow-x-auto">
                  {summary.formatted_summary}
                </pre>
              </CardContent>
            </Card>

            {/* Additional Summary Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Catatan Ringkasan Tambahan</CardTitle>
                <CardDescription>
                  Tambahkan catatan khusus untuk sesi ini
                </CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  className="w-full border rounded-md p-3"
                  rows={4}
                  placeholder="Tambahkan catatan ringkasan tambahan..."
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-sm hover:bg-gray-100"
            disabled={saving}
          >
            Tutup
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "Simpan Catatan"}
          </button>
        </div>
      </div>
    </div>
  )
}
