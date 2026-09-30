import Icon from '../../components/ui/Icon'
import { monthCells, toISO } from '../../utils/dates'
import { getDayStatus } from '../../services/viewingService'

const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// A month calendar. Days that cannot be booked are greyed out and say why
// ("Full" or "Off"). `offset` is how many months away from this month.
export default function ViewingCalendar({ today, offset, onOffsetChange, selected, onSelect, maxOffset = 2 }) {
  const shown = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const cells = monthCells(shown.getFullYear(), shown.getMonth())
  const title = shown.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="calendar">
      <div className="calendar__head">
        <h3>{title}</h3>
        <div>
          <button
            type="button"
            aria-label="Previous month"
            disabled={offset === 0}
            onClick={() => onOffsetChange(offset - 1)}
          >
            <Icon name="chevronLeft" size={14} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            disabled={offset >= maxOffset}
            onClick={() => onOffsetChange(offset + 1)}
          >
            <Icon name="chevronRight" size={14} />
          </button>
        </div>
      </div>

      <div className="calendar__grid" role="grid" aria-label={title}>
        {weekdays.map((w, i) => <span key={i} className="calendar__weekday">{w}</span>)}
        {cells.map((date, i) => {
          if (!date) return <span key={`blank-${i}`} />
          const status = getDayStatus(date, today)
          const iso = toISO(date)
          const isSelected = iso === selected
          return (
            <button
              key={iso}
              type="button"
              disabled={status !== 'open'}
              aria-pressed={isSelected}
              aria-label={`${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}${status === 'full' ? ', fully booked' : status === 'off' ? ', closed' : ''}`}
              className={`calendar__day calendar__day--${status} ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelect(iso)}
            >
              <b>{date.getDate()}</b>
              {status === 'full' && <small>Full</small>}
              {status === 'off' && <small>Off</small>}
              {status === 'open' && <i aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
