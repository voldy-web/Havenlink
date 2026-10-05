import { useState } from 'react'
import Icon from './Icon'

// A password box with a lock icon and an eye button that shows or hides what you typed. Styles live in Auth.css.
export default function PasswordInput({ value, onChange, autoComplete, invalid = false }) {
  const [shown, setShown] = useState(false)
  return (
    <span className="auth__input">
      <Icon name="lock" size={17} />
      <input type={shown ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} aria-invalid={invalid} />
      <button type="button" className="auth__eye" onClick={() => setShown((v) => !v)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}>
        <Icon name={shown ? 'eye-off' : 'eye'} size={18} />
      </button>
    </span>
  )
}
