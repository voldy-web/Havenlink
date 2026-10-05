// Shared helpers for tenancies (used by the resident and owner routes).
import { pool } from '../db/pool.js'

export const ROOMS = ['Living room', 'Bedroom', 'Kitchen', 'Bathroom', 'Outdoor or other']
export const CONDITIONS = ['Good', 'Fair', 'Poor']
export const LIVE = ['Offered', 'Active', 'Notice given']

// Checks a list of rooms with their condition and a short note. Returns an error message or null.
export function checkRooms(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > ROOMS.length) return 'Add the condition of at least one room.'
  const seen = new Set()
  for (const i of items) {
    if (!i || !ROOMS.includes(i.room) || seen.has(i.room)) return 'Each room can be listed once, using the room names provided.'
    seen.add(i.room)
    if (!CONDITIONS.includes(i.condition)) return 'Choose Good, Fair or Poor for every room.'
    if (i.note !== undefined && (typeof i.note !== 'string' || i.note.length > 300)) return 'A room note is too long (300 characters at most).'
  }
  return null
}

// The tenancy as the website uses it. `other` is the other person: the owner (for the resident) or the resident (for the owner).
export async function toTenancies(rows, perspective) {
  if (!rows.length) return []
  const ids = rows.map((r) => r.id)
  const items = (await pool.query('select tenancy_id, stage, room, condition, note from condition_items where tenancy_id = any($1) order by id', [ids])).rows
  const people = (await pool.query(
    'select id, name, phone, email from users where id = any($1)',
    [rows.map((r) => (perspective === 'resident' ? r.owner_id : r.resident_id))],
  )).rows
  const list = (id, stage) => items.filter((i) => i.tenancy_id === id && i.stage === stage).map(({ room, condition, note }) => ({ room, condition, note }))
  return rows.map((r) => {
    const person = people.find((p) => p.id === (perspective === 'resident' ? r.owner_id : r.resident_id))
    return {
      reference: r.reference, status: r.status, propertyId: r.property_id, propertyTitle: r.property_title,
      monthlyRent: r.monthly_rent, deposit: r.deposit, startDate: r.start_date, termMonths: r.term_months, endDate: r.end_date,
      moveOutDate: r.move_out_date, noticeGivenAt: r.notice_given_at, createdAt: r.created_at, endedAt: r.ended_at,
      moveIn: { submittedAt: r.move_in_submitted_at, acknowledgedAt: r.move_in_acknowledged_at, items: list(r.id, 'move_in') },
      moveOut: { items: list(r.id, 'move_out') },
      settlement: r.settlement,
      [perspective === 'resident' ? 'owner' : 'resident']: perspective === 'resident'
        ? { name: person?.name }
        : { name: person?.name, phone: person?.phone, email: person?.email },
    }
  })
}

// "select" text that also works out when the term ends.
export const TENANCY_COLUMNS = "t.*, (t.start_date + (t.term_months || ' months')::interval)::date as end_date"

// The status shown on the home's page follows its tenancy: Rented while someone lives there.
export const setHomeStatus = (db, propertyId, status) =>
  db.query("update properties set data = jsonb_set(data, '{status}', to_jsonb($2::text)) where id = $1", [propertyId, status])
