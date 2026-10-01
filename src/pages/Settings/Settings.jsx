import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { useAuth } from '../../hooks/useAuth'
import { defaultPrivacy, exportMyData } from '../../services/authService'
import './Settings.css'

// The privacy switches. `key` matches what the server stores.
const privacyOptions = [
  { key: 'maskContact', title: 'Hide my contact details', text: 'Your phone and email are only shared with people you have booked or hired, not with other pros or agents.' },
  { key: 'anonymousReviews', title: 'Post reviews anonymously', text: 'Reviews you write show a nickname instead of your name.' },
  { key: 'residentDirectory', title: 'Show me in the resident directory', text: 'Let verified neighbours in your building see your name.' },
]

// Small on/off switch used by the privacy options.
function Switch({ on, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`st-switch ${on ? 'is-on' : ''}`} onClick={() => onChange(!on)}>
      <span />
    </button>
  )
}

export default function Settings() {
  const { user, demo, saveProfile, setPassword, removeAccount } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: user.name, phone: user.phone, emergencyName: user.emergencyName ?? '', emergencyPhone: user.emergencyPhone ?? '',
    privacy: { ...defaultPrivacy, ...user.privacy },
  })
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')
  const set = (patch) => { setNotice(''); setForm((f) => ({ ...f, ...patch })) }

  const [pw, setPw] = useState({ current: '', next: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwNotice, setPwNotice] = useState('')

  const [confirming, setConfirming] = useState(false)
  const [deletePw, setDeletePw] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const dirty = form.name !== user.name || form.phone !== user.phone || form.emergencyName !== (user.emergencyName ?? '')
    || form.emergencyPhone !== (user.emergencyPhone ?? '') || JSON.stringify(form.privacy) !== JSON.stringify({ ...defaultPrivacy, ...user.privacy })

  async function save(e) {
    e.preventDefault()
    const found = {}
    if (form.name.trim().length < 2) found.name = 'Enter your full name.'
    if (form.phone.replace(/\D/g, '').length < 9) found.phone = 'Enter a phone number.'
    if (form.emergencyName.trim() && form.emergencyName.trim().length < 2) found.emergencyName = 'Enter a name.'
    if (form.emergencyPhone.trim() && form.emergencyPhone.replace(/\D/g, '').length < 9) found.emergencyPhone = 'Enter a phone number.'
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy('save')
    try {
      await saveProfile({ ...form, name: form.name.trim(), phone: form.phone.trim(), emergencyName: form.emergencyName.trim(), emergencyPhone: form.emergencyPhone.trim() })
      setNotice('Your changes are saved.')
    } catch (err) {
      setErrors({ form: err.message, ...err.fields })
    }
    setBusy('')
  }

  async function changePw(e) {
    e.preventDefault()
    const found = {}
    if (!pw.current) found.current = 'Enter your current password.'
    if (pw.next.length < 8) found.next = 'Use at least 8 characters.'
    setPwErrors(found)
    setPwNotice('')
    if (Object.keys(found).length) return
    setBusy('password')
    try {
      await setPassword(pw.current, pw.next)
      setPw({ current: '', next: '' })
      setPwNotice('Password changed. Other devices have been signed out.')
    } catch (err) {
      setPwErrors({ form: err.message, current: err.fields?.currentPassword, next: err.fields?.newPassword })
    }
    setBusy('')
  }

  async function download() {
    setBusy('export')
    try {
      await exportMyData(user)
    } catch (err) {
      setNotice(err.message)
    }
    setBusy('')
  }

  async function remove(e) {
    e.preventDefault()
    setBusy('delete')
    setDeleteError('')
    try {
      await removeAccount(deletePw)
      navigate('/', { replace: true })
    } catch (err) {
      setDeleteError(err.message)
      setBusy('')
    }
  }

  return (
    <div className="st">
      <header>
        <h1>Profile &amp; Settings</h1>
        <p>Keep your details up to date and choose how your information is used.</p>
      </header>

      <form className="st-panel" onSubmit={save} noValidate>
        <h2>Personal information</h2>
        <div className="st-grid">
          <label className="st-field"><span>Full name</span>
            <input value={form.name} onChange={(e) => set({ name: e.target.value })} aria-invalid={Boolean(errors.name)} autoComplete="name" />
            {errors.name && <em>{errors.name}</em>}</label>
          <label className="st-field"><span>Mobile phone</span>
            <input type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} aria-invalid={Boolean(errors.phone)} autoComplete="tel" />
            {errors.phone && <em>{errors.phone}</em>}</label>
          <label className="st-field st-field--wide"><span>Email address <b>Cannot be changed here</b></span>
            <input value={user.email} readOnly /></label>
          <label className="st-field"><span>Emergency contact name <small>(optional)</small></span>
            <input value={form.emergencyName} onChange={(e) => set({ emergencyName: e.target.value })} aria-invalid={Boolean(errors.emergencyName)} />
            {errors.emergencyName && <em>{errors.emergencyName}</em>}</label>
          <label className="st-field"><span>Emergency contact phone <small>(optional)</small></span>
            <input type="tel" value={form.emergencyPhone} onChange={(e) => set({ emergencyPhone: e.target.value })} aria-invalid={Boolean(errors.emergencyPhone)} />
            {errors.emergencyPhone && <em>{errors.emergencyPhone}</em>}</label>
        </div>

        <h2 className="st-sub">Privacy</h2>
        <ul className="st-privacy">
          {privacyOptions.map((o) => (
            <li key={o.key}>
              <div><b>{o.title}</b><small>{o.text}</small></div>
              <Switch on={form.privacy[o.key]} label={o.title} onChange={(v) => set({ privacy: { ...form.privacy, [o.key]: v } })} />
            </li>
          ))}
        </ul>

        {errors.form && <p className="st-error" role="alert">{errors.form}</p>}
        <div className="st-actions">
          <button className="st-btn" disabled={busy === 'save' || !dirty}>{busy === 'save' ? 'Saving…' : 'Save changes'}</button>
          {notice && <span className="st-ok" role="status"><Icon name="check" size={15} /> {notice}</span>}
        </div>
      </form>

      <form className="st-panel" onSubmit={changePw} noValidate>
        <h2>Password</h2>
        {demo ? (
          <p className="st-muted">Demo mode keeps accounts in this browser and never stores passwords, so there is nothing to change here.</p>
        ) : (
          <>
            <div className="st-grid">
              <label className="st-field"><span>Current password</span>
                <input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} aria-invalid={Boolean(pwErrors.current)} autoComplete="current-password" />
                {pwErrors.current && <em>{pwErrors.current}</em>}</label>
              <label className="st-field"><span>New password</span>
                <input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} aria-invalid={Boolean(pwErrors.next)} autoComplete="new-password" />
                {pwErrors.next && <em>{pwErrors.next}</em>}</label>
            </div>
            {pwErrors.form && !pwErrors.current && !pwErrors.next && <p className="st-error" role="alert">{pwErrors.form}</p>}
            <div className="st-actions">
              <button className="st-btn st-btn--outline" disabled={busy === 'password'}>{busy === 'password' ? 'Changing…' : 'Change password'}</button>
              {pwNotice && <span className="st-ok" role="status"><Icon name="check" size={15} /> {pwNotice}</span>}
            </div>
          </>
        )}
      </form>

      <section className="st-panel">
        <h2>Your data</h2>
        <p className="st-muted">Download a copy of everything Haven Link holds about your account: your details, saved homes, viewings, reports, orders and unlocks.</p>
        <div className="st-actions">
          <button type="button" className="st-btn st-btn--outline" onClick={download} disabled={busy === 'export'}>{busy === 'export' ? 'Preparing…' : 'Download my data'}</button>
        </div>
      </section>

      <section className="st-panel st-panel--danger">
        <h2>Delete account</h2>
        <p className="st-muted">This permanently removes your account and all your saved homes, viewings, reports, orders and unlocks. It cannot be undone.</p>
        {!confirming ? (
          <button type="button" className="st-btn st-btn--danger" onClick={() => setConfirming(true)}>Delete my account</button>
        ) : (
          <form onSubmit={remove} noValidate>
            {!demo && (
              <label className="st-field"><span>Enter your password to confirm</span>
                <input type="password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} autoComplete="current-password" /></label>
            )}
            {deleteError && <p className="st-error" role="alert">{deleteError}</p>}
            <div className="st-actions">
              <button className="st-btn st-btn--danger" disabled={busy === 'delete' || (!demo && !deletePw)}>{busy === 'delete' ? 'Deleting…' : 'Yes, delete everything'}</button>
              <button type="button" className="st-btn st-btn--outline" onClick={() => { setConfirming(false); setDeletePw(''); setDeleteError('') }}>Cancel</button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
