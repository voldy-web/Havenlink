import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { createReport } from '../../services/reportService'
import { reportCategories, urgencies, EMERGENCY_PHONE } from '../../data/reportOptions'
import { resizeImage } from '../../utils/image'
import './ReportProblem.css'

const MAX_PHOTOS = 3
const LAST_HOME_KEY = 'havenlink_last_home'

const lastHome = () => {
  try { return localStorage.getItem(LAST_HOME_KEY) || '' } catch { return '' }
}

export default function ReportProblem() {
  const [form, setForm] = useState({ category: '', urgency: 'medium', summary: '', description: '', home: lastHome() })
  const [photos, setPhotos] = useState([])
  const [errors, setErrors] = useState({})
  const [photoNote, setPhotoNote] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(null)
  const fileInput = useRef(null)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  async function addPhotos(e) {
    const files = [...e.target.files].slice(0, MAX_PHOTOS - photos.length)
    e.target.value = ''
    const results = await Promise.all(files.map((f) => resizeImage(f)))
    const good = results.filter(Boolean)
    setPhotoNote(good.length < files.length ? 'Some files were not images and were skipped.' : '')
    setPhotos((p) => [...p, ...good].slice(0, MAX_PHOTOS))
  }

  async function submit(ev) {
    ev.preventDefault()
    const found = {}
    if (form.home.trim().length < 4) found.home = 'Enter the home and unit this is about.'
    if (!form.category) found.category = 'Choose what is causing the issue.'
    if (form.summary.trim().length < 5) found.summary = 'Give the problem a short title.'
    if (form.description.trim().length < 10) found.description = 'Describe what is happening (at least a sentence).'
    setErrors(found)
    if (Object.keys(found).length) {
      document.querySelector('[aria-invalid="true"], .rp-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSending(true)
    try { localStorage.setItem(LAST_HOME_KEY, form.home.trim()) } catch { /* storage blocked: fine */ }
    const report = await createReport({ ...form, home: form.home.trim(), summary: form.summary.trim(), description: form.description.trim(), photos })
    setSending(false)
    setDone(report)
    window.scrollTo(0, 0)
  }

  if (done) {
    return (
      <section className="rp rp--done">
        <span className="rp__icon"><Icon name="check" size={32} /></span>
        <h1>Problem reported</h1>
        <p>The owner has been notified. You can follow every step from Submitted to Resolved.</p>
        <dl className="rp__summary">
          <div><dt>Reference</dt><dd>{done.reference}</dd></div>
          <div><dt>Issue</dt><dd>{done.summary}</dd></div>
          <div><dt>Priority</dt><dd>{urgencies.find((u) => u.id === done.urgency)?.label}</dd></div>
          <div><dt>Status</dt><dd>{done.status}</dd></div>
        </dl>
        <div className="rp__buttons">
          <Button to="/reports">Track this report</Button>
          <Button to="/dashboard" variant="outline">Back to dashboard</Button>
        </div>
      </section>
    )
  }

  return (
    <form className="rp" onSubmit={submit} noValidate>
      <p className="eyebrow">Maintenance · New report</p>
      <h1>Report a Problem in Your Home</h1>
      <p className="rp__lead">Tell the owner what is wrong. Add photos if you can, and choose how urgent it is.</p>

      <section className="rp-panel">
        <h2>Which home?</h2>
        <label className="rp-field">
          <span>Home and unit</span>
          <input value={form.home} onChange={(e) => set({ home: e.target.value })} placeholder="e.g. 12 Palm Avenue, Flat 3, East Legon" aria-invalid={Boolean(errors.home)} />
          {errors.home && <em>{errors.home}</em>}
        </label>
        <p className="rp__note">Reporting is meant for tenants and people who have reserved a home. Accounts will check this once login is added.</p>
      </section>

      <section className="rp-panel">
        <h2>What is causing the issue?</h2>
        <div className="rp-cats" role="radiogroup" aria-label="Category">
          {reportCategories.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={form.category === c.id} className={form.category === c.id ? 'is-active' : ''} onClick={() => set({ category: c.id })}>
              <Icon name={c.icon} size={22} /><b>{c.label}</b><small>{c.hint}</small>
            </button>
          ))}
        </div>
        {errors.category && <p className="rp-error">{errors.category}</p>}
      </section>

      <section className="rp-panel">
        <h2>How urgent is it?</h2>
        <div className="rp-urg" role="radiogroup" aria-label="Urgency">
          {urgencies.map((u) => (
            <button key={u.id} type="button" role="radio" aria-checked={form.urgency === u.id} className={`rp-urg--${u.id} ${form.urgency === u.id ? 'is-active' : ''}`} onClick={() => set({ urgency: u.id })}>
              <b><i /> {u.label}</b><span>{u.text}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rp-panel">
        <h2>Details &amp; photos</h2>
        <label className="rp-field">
          <span>Short title</span>
          <input value={form.summary} onChange={(e) => set({ summary: e.target.value })} placeholder="e.g. Kitchen sink is leaking" maxLength={90} aria-invalid={Boolean(errors.summary)} />
          {errors.summary && <em>{errors.summary}</em>}
        </label>
        <label className="rp-field">
          <span>What is happening?</span>
          <textarea rows="4" value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="When did it start? Where exactly is it? Is it getting worse?" aria-invalid={Boolean(errors.description)} />
          {errors.description && <em>{errors.description}</em>}
        </label>

        <div className="rp-photos">
          <span>Photos (optional, up to {MAX_PHOTOS})</span>
          <div>
            {photos.map((src, i) => (
              <figure key={i}>
                <img src={src} alt={`Attached photo ${i + 1}`} />
                <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))}><Icon name="close" size={12} /></button>
              </figure>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button type="button" className="rp-photos__add" onClick={() => fileInput.current.click()}>
                <Icon name="camera" size={20} /> Add photo
              </button>
            )}
          </div>
          <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={addPhotos} />
          {photoNote && <small className="rp__note">{photoNote}</small>}
        </div>
      </section>

      <button type="submit" className="rp__submit" disabled={sending}>
        <Icon name="shield" size={16} /> {sending ? 'Sending…' : 'Submit Report'}
      </button>

      <aside className="rp-emergency">
        <b><Icon name="bolt" size={16} /> Emergency?</b>
        <p>Gas smell, fire, a collapse or serious flooding: get everyone out and call for help first.</p>
        <a href={`tel:${EMERGENCY_PHONE.replace(/\s/g, '')}`}><Icon name="phone" size={14} /> {EMERGENCY_PHONE}</a>
        <small>Placeholder number. Replace it with your real 24/7 line.</small>
      </aside>
      <p className="rp__back"><Link to="/reports">&larr; See my reports</Link></p>
    </form>
  )
}
