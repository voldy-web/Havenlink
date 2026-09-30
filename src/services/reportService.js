// Problem reports. Today they are saved in the browser (localStorage); when
// the backend exists, these functions will call the API and the pages stay
// the same. The owner side (acknowledging, assigning) is not built yet, so
// advanceReport() lets you step a report forward to try the tracker.
import { reportStages } from '../data/reportOptions'

const KEY = 'havenlink_reports'

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || []
  } catch {
    return []
  }
}

function writeAll(reports) {
  try {
    localStorage.setItem(KEY, JSON.stringify(reports))
    return true
  } catch {
    return false
  }
}

export async function createReport(details) {
  const now = new Date().toISOString()
  const report = {
    ...details,
    reference: `HL-R-${Date.now().toString().slice(-6)}`,
    status: 'Submitted',
    history: [{ status: 'Submitted', at: now }],
    createdAt: now,
  }
  const saved = writeAll([report, ...readAll()])
  // If storage is full, retry without the photos so the report itself is not lost.
  if (!saved) writeAll([{ ...report, photos: [] }, ...readAll()])
  return report
}

export async function getMyReports() {
  return readAll()
}

// DEMO ONLY: moves a report to its next stage.
export async function advanceReport(reference) {
  const order = reportStages.map((s) => s.id)
  const reports = readAll().map((r) => {
    if (r.reference !== reference) return r
    const next = order[order.indexOf(r.status) + 1]
    return next ? { ...r, status: next, history: [...r.history, { status: next, at: new Date().toISOString() }] } : r
  })
  writeAll(reports)
  return reports
}
