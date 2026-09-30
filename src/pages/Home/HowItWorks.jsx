import { Link } from 'react-router-dom'
import { steps } from '../../data/home'
import './HowItWorks.css'

export default function HowItWorks() {
  return (
    <section className="how">
      <div className="container">
        <div className="section-title">
          <p className="eyebrow">Frictionless Process</p>
          <h2>How Haven Link Works</h2>
          <p>
            From the first look at a listing to settling into your furnished
            home, everything happens in one place.
          </p>
        </div>

        <div className="how__grid">
          {steps.map((step) => (
            <article key={step.number} className="how__card">
              <span className="how__number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <Link to={step.to}>{step.link} &rsaquo;</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
