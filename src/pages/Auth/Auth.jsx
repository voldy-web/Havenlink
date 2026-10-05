import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import GoogleButton from '../../components/auth/GoogleButton'
import { googleEnabled } from '../../services/googleConfig'
import { useAuth } from '../../hooks/useAuth'
import { roles } from '../../data/roles'
import './Auth.css'

// Only allow going back to a page inside this site (never an outside link).
const safeNext = (value) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard')

const points = [
  { icon: 'search', title: 'Find a home', text: 'Search verified rentals and homes for sale by area and price.' },
  { icon: 'shield', title: 'Report problems', text: 'Log faults with photos and follow them until they are fixed.' },
  { icon: 'tool', title: 'Hire trusted pros', text: 'Plumbers, electricians and more, with clear rates.' },
  { icon: 'bag', title: 'Furnish your home', text: 'Beds, couches and appliances delivered to your door.' },
]

export default function Auth({ mode }) {
  const isRegister = mode === 'register'
  const { user, loading, demo, login, register, loginWithGoogle, continueAs } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const wantedRole = roles.some((r) => r.id === params.get('role')) ? params.get('role') : 'resident'
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: wantedRole, agree: false })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [linkedUser, setLinkedUser] = useState(null) // set after an email account is linked to Google
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  if (loading) return null
  if (user && !linkedUser) return <Navigate to={next} replace />

  async function submit(e) {
    e.preventDefault()
    const found = {}
    if (isRegister && form.name.trim().length < 2) found.name = 'Enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Enter a valid email address.'
    if (isRegister && form.phone.replace(/\D/g, '').length < 9) found.phone = 'Enter a phone number.'
    if (isRegister ? form.password.length < 8 : form.password.length < 1) found.password = isRegister ? 'Use at least 8 characters.' : 'Enter your password.'
    if (isRegister && !form.agree) found.agree = 'Please accept the terms to continue.'
    setErrors(found)
    if (Object.keys(found).length) return

    setBusy(true)
    const result = isRegister ? await register(form) : await login(form.email, form.password)
    setBusy(false)
    if (result.error) return setErrors({ form: result.error, ...result.fields })
    navigate(next, { replace: true })
  }

  async function google(credential) {
    if (isRegister && !form.agree) return setErrors({ agree: 'Please accept the terms, then continue with Google again.' })
    setErrors({})
    const result = await loginWithGoogle(credential, isRegister ? form.role : undefined)
    if (result.error) return setErrors({ form: result.error })
    if (result.linked) return setLinkedUser(result.user)
    navigate(next, { replace: true })
  }

  if (linkedUser) {
    return (
      <div className="container auth auth--single">
        <div className="auth__card">
          <h1 className="auth__title">Google account linked</h1>
          <p className="auth__ok" role="status"><Icon name="check" size={16} /> <span>You already had a Haven Link account with {linkedUser.email}. It is now linked to your Google account. For safety, its old password was removed and other devices were signed out.</span></p>
          <p className="auth__hint">From now on, use <b>Continue with Google</b>. If you want a password again, use “Forgot password?” on the sign-in page.</p>
          <button type="button" className="auth__submit" onClick={() => { continueAs(linkedUser); navigate(next, { replace: true }) }}>Continue <Icon name="arrow" size={16} /></button>
        </div>
      </div>
    )
  }

  const other = isRegister ? '/login' : '/register'
  const otherLink = next === '/dashboard' ? other : `${other}?next=${encodeURIComponent(next)}`

  return (
    <div className="container auth">
      <aside className="auth__aside">
        <h1>One place for your whole housing journey.</h1>
        <p>Find a home, book a viewing, report problems, hire trusted pros and furnish your space.</p>
        <ul>
          {points.map((p) => (
            <li key={p.title}><span><Icon name={p.icon} size={18} /></span><div><b>{p.title}</b><small>{p.text}</small></div></li>
          ))}
        </ul>
      </aside>

      <form className="auth__card" onSubmit={submit} noValidate>
        <div className="auth__tabs" role="tablist">
          <Link role="tab" aria-selected={isRegister} className={isRegister ? 'is-active' : ''} to={`/register${next === '/dashboard' ? '' : `?next=${encodeURIComponent(next)}`}`}>Create an Account</Link>
          <Link role="tab" aria-selected={!isRegister} className={!isRegister ? 'is-active' : ''} to={`/login${next === '/dashboard' ? '' : `?next=${encodeURIComponent(next)}`}`}>Sign In</Link>
        </div>

        {demo && <p className="auth__demo"><Icon name="shield" size={14} /> Demo mode: accounts are kept in this browser only and passwords are not saved. Real accounts arrive with the backend.</p>}
        {errors.form && <p className="auth__error" role="alert">{errors.form}{!errors.form.startsWith('Cannot reach') && <> <Link to={otherLink}>{isRegister ? 'Sign in' : 'Create account'}</Link></>}</p>}

        {isRegister && (
          <fieldset className="auth__roles">
            <legend>I am a…</legend>
            {roles.map((r) => (
              <label key={r.id} className={form.role === r.id ? 'is-active' : ''}>
                <input type="radio" name="role" checked={form.role === r.id} onChange={() => set({ role: r.id })} />
                <span><Icon name={r.icon} size={18} /></span>
                <div><b>{r.label}</b><small>{r.text}</small></div>
              </label>
            ))}
          </fieldset>
        )}

        {isRegister && (
          <label className="auth__field">
            <span>Full name</span>
            <input value={form.name} onChange={(e) => set({ name: e.target.value })} autoComplete="name" aria-invalid={Boolean(errors.name)} />
            {errors.name && <em>{errors.name}</em>}
          </label>
        )}
        <label className="auth__field">
          <span>Email address</span>
          <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} autoComplete="email" aria-invalid={Boolean(errors.email)} />
          {errors.email && <em>{errors.email}</em>}
        </label>
        {isRegister && (
          <label className="auth__field">
            <span>Phone number</span>
            <input type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="024 123 4567" autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
            {errors.phone && <em>{errors.phone}</em>}
          </label>
        )}
        <label className="auth__field">
          <span>Password</span>
          <span className="auth__pw">
            <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => set({ password: e.target.value })} autoComplete={isRegister ? 'new-password' : 'current-password'} aria-invalid={Boolean(errors.password)} />
            <button type="button" className="auth__eye" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
              <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
            </button>
          </span>
          {errors.password && <em>{errors.password}</em>}
        </label>
        {!isRegister && <Link to="/forgot-password" className="auth__forgot">Forgot password?</Link>}

        {isRegister && (
          <label className="auth__agree">
            <input type="checkbox" checked={form.agree} onChange={(e) => set({ agree: e.target.checked })} />
            <span>I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Statement</Link>.</span>
          </label>
        )}
        {errors.agree && <em className="auth__agree-error">{errors.agree}</em>}

        <button type="submit" className="auth__submit" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'} <Icon name="arrow" size={16} />
        </button>
        {googleEnabled && !demo && (
          <>
            <p className="auth__or"><span>or</span></p>
            <GoogleButton onCredential={google} />
          </>
        )}
        <p className="auth__switch">
          {isRegister ? 'Already have an account?' : 'New to Haven Link?'} <Link to={otherLink}>{isRegister ? 'Sign in instead' : 'Create an account'}</Link>
        </p>
      </form>
    </div>
  )
}
