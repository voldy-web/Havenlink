import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID, googleEnabled } from '../../services/googleConfig'

let scriptPromise
function loadGoogle() {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google)
    const script = Object.assign(document.createElement('script'), { src: 'https://accounts.google.com/gsi/client', async: true })
    script.onload = () => resolve(window.google)
    script.onerror = () => { scriptPromise = undefined; reject(new Error('blocked')) }
    document.head.append(script)
  })
  return scriptPromise
}

const GoogleG = () => (
  <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)

// "Continue with Google". Google only lets its own button start the sign-in, and that button changes its
// wording to "Continue as <your name>" when someone is signed in to Google. So our own button is drawn
// underneath (always saying "Continue with Google") and Google's real button sits on top, invisible but clickable.
export default function GoogleButton({ onCredential }) {
  const native = useRef(null)
  const callback = useRef(onCredential)
  const [failed, setFailed] = useState(false)
  useEffect(() => { callback.current = onCredential })

  useEffect(() => {
    if (!googleEnabled) return undefined
    let ignore = false
    loadGoogle()
      .then((google) => {
        if (ignore || !native.current) return
        google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => callback.current(r.credential) })
        const width = Math.min(400, Math.max(200, Math.round(native.current.offsetWidth)))
        google.accounts.id.renderButton(native.current, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width })
      })
      .catch(() => { if (!ignore) setFailed(true) })
    return () => { ignore = true }
  }, [])

  if (!googleEnabled) return null
  return (
    <div className="auth__google">
      <div className="auth__gbtn">
        <span className="auth__gvisual"><GoogleG /> Continue with Google</span>
        <div ref={native} className="auth__gnative" />
      </div>
      {failed && <p className="auth__google-fail">Google sign-in could not load. Check your connection or an ad blocker.</p>}
    </div>
  )
}
