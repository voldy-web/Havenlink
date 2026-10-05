import { CONDITIONS, ROOMS } from '../../services/tenancyService'

// A row per room: tick the rooms that apply, choose Good / Fair / Poor, and add a short note.
// `value` is a list like [{ room, condition, note }]; `onChange` gets the new list.
export default function RoomChecklist({ value, onChange, disabled = false }) {
  const find = (room) => value.find((i) => i.room === room)
  const toggle = (room) => onChange(find(room) ? value.filter((i) => i.room !== room) : [...value, { room, condition: 'Good', note: '' }])
  const edit = (room, patch) => onChange(value.map((i) => (i.room === room ? { ...i, ...patch } : i)))

  return (
    <ul className="tn__rooms">
      {ROOMS.map((room) => {
        const item = find(room)
        return (
          <li key={room} className={item ? 'is-on' : ''}>
            <label className="tn__room-name">
              <input type="checkbox" checked={Boolean(item)} disabled={disabled} onChange={() => toggle(room)} /> {room}
            </label>
            {item && (
              <div className="tn__room-fields">
                <select aria-label={`${room} condition`} value={item.condition} disabled={disabled} onChange={(e) => edit(room, { condition: e.target.value })}>
                  {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input aria-label={`${room} note`} value={item.note} maxLength={300} disabled={disabled} onChange={(e) => edit(room, { note: e.target.value })} placeholder="Short note (optional), for example: small crack in the window" />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

// Read-only list of what was written for each room.
export function RoomList({ items, empty = 'Nothing written yet.' }) {
  if (!items.length) return <p className="tn__muted">{empty}</p>
  return (
    <ul className="tn__summary">
      {items.map((i) => (
        <li key={i.room}><b>{i.room}</b> <span className={`tn__cond tn__cond--${i.condition.toLowerCase()}`}>{i.condition}</span>{i.note && <small>{i.note}</small>}</li>
      ))}
    </ul>
  )
}
