import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { requestPasswordReset } from '../../services/authService'
import './Auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    setError('')
    setBusy(true)
    const result = await requestPasswordReset(email.trim())
    setBusy(false)
    if (result.error) setError(result.error)
    else setSent(true)
  }

  return (
    <div className="container auth auth--single">
      <form className="auth__card" onSubmit={submit} noValidate>
        <h1 className="auth__title">Forgot your password?</h1>
        {sent ? (
          <>
            <p className="auth__ok" role="status"><Icon name="check" size={16} /> <span>If an account exists for <b>{email}</b>, we have sent a link to choose a new password. It works for 1 hour.</span></p>
            <p className="auth__hint">Nothing arrived? Check your spam folder, or try again in a few minutes.</p>
          </>
        ) : (
          <>
            <p className="auth__hint">Enter the email you signed up with and we will send you a link to choose a new password.</p>
            {error && <p className="auth__error" role="alert">{error}</p>}
            <label className="auth__field">
              <span>Email address</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <button type="submit" className="auth__submit" disabled={busy}>{busy ? 'Please wait…' : 'Send reset link'} <Icon name="arrow" size={16} /></button>
          </>
        )}
        <p className="auth__switch"><Link to="/login">Back to sign in</Link></p>
      </form>
    </div>
  )
}
