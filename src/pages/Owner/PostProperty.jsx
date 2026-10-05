import { Link, Navigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

// The "Post Property" button in the menu leads here. Owners go straight to the form.
export default function PostProperty() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user?.role === 'owner') return <Navigate to="/owner/new" replace />

  return (
    <section className="container coming-soon">
      <h1>Post your property on Haven Link</h1>
      <p>Add photos and details, we check them, and your home goes live for people to view and enquire.</p>
      {user ? (
        <>
          <p>You are signed in with a <b>{user.role}</b> account, and only owner accounts can post homes. Please create a separate owner account with a different email address.</p>
          <Button to="/register?role=owner&next=/owner/new">Create an owner account</Button>
        </>
      ) : (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button to="/register?role=owner&next=/owner/new">Create an owner account</Button>
          <Button to="/login?next=/owner/new" variant="outline">Sign in</Button>
        </div>
      )}
      <p><Link to="/properties">Browse homes instead</Link></p>
    </section>
  )
}
