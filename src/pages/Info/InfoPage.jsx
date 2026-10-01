import './Info.css'

// Shared frame for text pages (Help, Terms, Privacy): a title, an intro and a column of content.
export default function InfoPage({ eyebrow, title, intro, children }) {
  return (
    <section className="container info">
      <header className="info__head">
        {eyebrow && <span>{eyebrow}</span>}
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </header>
      <div className="info__body">{children}</div>
    </section>
  )
}
