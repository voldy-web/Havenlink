import Icon from '../../components/ui/Icon'
import { testimonials } from '../../data/home'
import './Testimonials.css'

export default function Testimonials() {
  return (
    <section className="reviews">
      <div className="container">
        <div className="section-title">
          <p className="eyebrow">Community Trust</p>
          <h2>Stories From Real Sanctuaries</h2>
          <p>See how residents, home seekers and property owners use Haven Link.</p>
        </div>

        <div className="reviews__grid">
          {testimonials.map((t) => (
            <figure key={t.name} className="review">
              <div className="review__stars" aria-label="5 out of 5 stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Icon key={n} name="star" size={14} />
                ))}
              </div>
              <blockquote>&ldquo;{t.text}&rdquo;</blockquote>
              <figcaption>
                <span className="review__avatar">{t.initials}</span>
                <span>
                  <b>{t.name}</b>
                  <small>{t.role}</small>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
