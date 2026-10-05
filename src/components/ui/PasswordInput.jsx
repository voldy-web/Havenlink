import { useState } from 'react'
import Icon from './Icon'

// A password box with an eye button that shows or hides what you typed. Styles live in Auth.css.
export default function PasswordInput({ value, onChange, autoComplete, invalid = false }) {
  const [shown, setShown] = useState(false)
  return (
    <span className="auth__pw">
      <input type={shown ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} aria-invalid={invalid} />
      <button type="button" className="auth__eye" onClick={() => setShown((v) => !v)} aria-label={shown ? 'Hide password' : 'Show password'} aria-pressed={shown}>
        <Icon name={shown ? 'eye-off' : 'eye'} size={18} />
      </button>
    </span>
  )
}
