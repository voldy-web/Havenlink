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

// Google's own "Continue with Google" button. `onCredential` gets the token Google hands back.
export default function GoogleButton({ onCredential }) {
  const box = useRef(null)
  const callback = useRef(onCredential)
  const [failed, setFailed] = useState(false)
  useEffect(() => { callback.current = onCredential })

  useEffect(() => {
    if (!googleEnabled) return undefined
    let ignore = false
    loadGoogle()
      .then((google) => {
        if (ignore || !box.current) return
        google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => callback.current(r.credential) })
        const width = Math.min(400, Math.max(200, Math.round(box.current.offsetWidth)))
        google.accounts.id.renderButton(box.current, { theme: 'outline', size: 'large', text: 'continue_with', shape: 'pill', width, logo_alignment: 'center' })
      })
      .catch(() => { if (!ignore) setFailed(true) })
    return () => { ignore = true }
  }, [])

  if (!googleEnabled) return null
  return (
    <div className="auth__google">
      <div ref={box} className="auth__google-btn" />
      {failed && <p className="auth__google-fail">Google sign-in could not load. Check your connection or an ad blocker.</p>}
    </div>
  )
}
