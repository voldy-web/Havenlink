import Button from '../../components/ui/Button'
import './ComingSoon.css'

// Temporary page for routes we have not built yet, so every navbar
// link works. Each one gets replaced by its real page in a later step.
export default function ComingSoon({ title }) {
  return (
    <section className="container coming-soon">
      <h1>{title}</h1>
      <p>This page is coming soon.</p>
      <Button to="/">Back to Home</Button>
    </section>
  )
}
