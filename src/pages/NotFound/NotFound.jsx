import Button from '../../components/ui/Button'
import '../ComingSoon/ComingSoon.css'

// Shown for any URL that does not match a route.
export default function NotFound() {
  return (
    <section className="container coming-soon">
      <h1>Page not found</h1>
      <p>Sorry, we couldn't find the page you were looking for.</p>
      <Button to="/">Back to Home</Button>
    </section>
  )
}
