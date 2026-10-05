import { useEffect, useState } from 'react'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { getMyReports, advanceReport } from '../../services/reportService'
import { demoTools } from '../../services/api'
import { reportStages, reportCategories, urgencies } from '../../data/reportOptions'
import './MyReports.css'

const tabs = ['All', 'In Progress', 'Awaiting', 'Resolved']
// "Awaiting" = logged but not being worked on yet.
const inTab = (r, tab) =>
  tab === 'All' || (tab === 'In Progress' && r.status === 'In Progress') || (tab === 'Awaiting' && ['Submitted', 'Acknowledged'].includes(r.status)) || (tab === 'Resolved' && r.status === 'Resolved')

const when = (iso) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function MyReports() {
  const [reports, setReports] = useState(null)
  const [tab, setTab] = useState('All')
  const [zoom, setZoom] = useState(null)

  useEffect(() => {
    let ignore = false
    getMyReports().then((r) => { if (!ignore) setReports(r) })
    return () => { ignore = true }
  }, [])

  if (!reports) return <p>Loading…</p>
  const shown = reports.filter((r) => inTab(r, tab))
  const count = (t) => reports.filter((r) => inTab(r, t)).length

  return (
    <div className="mr">
      <header className="mr__head">
        <div>
          <h1>My Reports</h1>
          <p>Follow each problem from the moment you report it until it is fixed.</p>
        </div>
        <Button to="/reports/new">+ Report New Problem</Button>
      </header>

      <div className="mr__tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
            {t} <span>{count(t)}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="properties__empty">
          <h2>{reports.length ? 'No reports in this tab' : 'No reports yet'}</h2>
          <p>{reports.length ? 'Try another tab.' : 'When something in your home needs fixing, report it here and track it to the end.'}</p>
          {!reports.length && <Button to="/reports/new">Report a problem</Button>}
        </div>
      ) : (
        <div className="mr__list">
          {shown.map((r) => {
            const at = reportStages.findIndex((s) => s.id === r.status)
            const cat = reportCategories.find((c) => c.id === r.category)
            return (
              <article key={r.reference} className="rcard">
                <header>
                  <span className={`rcard__urg rcard__urg--${r.urgency}`}>{urgencies.find((u) => u.id === r.urgency)?.label}</span>
                  <span className="rcard__cat">{cat?.label}</span>
                  <small>{r.reference}</small>
                  <b className={`rcard__status ${r.status === 'Resolved' ? 'is-done' : ''}`}>{r.status}</b>
                </header>
                <h2>{r.summary}</h2>
                <p>{r.description}</p>
                <p className="rcard__where"><Icon name="pin" size={13} /> {r.home}</p>

                <ol className="rcard__steps">
                  {reportStages.map((s, i) => {
                    const entry = r.history.find((h) => h.status === s.id)
                    return (
                      <li key={s.id} className={i < at || (i === at && s.id === 'Resolved') ? 'is-done' : i === at ? 'is-current' : ''}>
                        <span>{i <= at ? <Icon name="check" size={13} /> : i + 1}</span>
                        <div><b>{s.id}</b><small>{entry ? when(entry.at) : 'Pending'}</small>{entry?.note && <small className="rcard__ownernote">“{entry.note}”</small>}</div>
                      </li>
                    )
                  })}
                </ol>
                <p className="rcard__now">{reportStages[at].text}</p>

                {r.photos?.length > 0 && (
                  <div className="rcard__photos">
                    {r.photos.map((src, i) => (
                      <button key={i} onClick={() => setZoom(src)} aria-label={`View photo ${i + 1}`}><img src={src} alt="" /></button>
                    ))}
                  </div>
                )}

                {demoTools && r.status !== 'Resolved' && (
                  <button className="rcard__demo" onClick={async () => setReports(await advanceReport(r.reference))}>
                    Demo: move to next stage
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}

      {zoom && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo" onClick={() => setZoom(null)}>
          <button className="lightbox__close" aria-label="Close" onClick={() => setZoom(null)}><Icon name="close" size={20} /></button>
          <figure onClick={(e) => e.stopPropagation()}><img src={zoom} alt="Report evidence" /></figure>
        </div>
      )}
    </div>
  )
}
