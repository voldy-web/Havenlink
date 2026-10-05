import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import PasswordInput from '../../components/ui/PasswordInput'
import { resetPassword } from '../../services/authService'
import './Auth.css'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError('The two passwords do not match.')
    setError('')
    setBusy(true)
    const result = await resetPassword(token, password)
    setBusy(false)
    if (result.error) setError(result.fields?.password || result.error)
    else setDone(true)
  }

  return (
    <div className="container auth auth--single">
      <form className="auth__card" onSubmit={submit} noValidate>
        <h1 className="auth__title">Choose a new password</h1>
        {done ? (
          <>
            <p className="auth__ok" role="status"><Icon name="check" size={16} /> <span>Your password has been changed. Any devices that were signed in have been signed out.</span></p>
            <Link to="/login" className="auth__submit">Sign in</Link>
          </>
        ) : !token ? (
          <p className="auth__error" role="alert">This page needs the link from your email. <Link to="/forgot-password">Ask for a new link</Link></p>
        ) : (
          <>
            {error && <p className="auth__error" role="alert">{error}{/expired|not valid/.test(error) && <> <Link to="/forgot-password">Ask for a new link</Link></>}</p>}
            <label className="auth__field"><span>New password</span><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></label>
            <label className="auth__field"><span>Type it again</span><PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" /></label>
            <button type="submit" className="auth__submit" disabled={busy}>{busy ? 'Please wait…' : 'Change password'} <Icon name="arrow" size={16} /></button>
          </>
        )}
      </form>
    </div>
  )
}
