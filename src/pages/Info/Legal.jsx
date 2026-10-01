import InfoPage from './InfoPage'
import { legalUpdated, terms, privacy } from '../../data/legal'

// One component for both legal pages; `kind` picks which text to show.
export default function Legal({ kind }) {
  const isTerms = kind === 'terms'
  const sections = isTerms ? terms : privacy
  return (
    <InfoPage
      eyebrow={`Last updated ${legalUpdated}`}
      title={isTerms ? 'Terms of Service' : 'Privacy Statement'}
      intro={isTerms ? 'The rules for using Haven Link, in plain language.' : 'How we collect, use and protect your information.'}
    >
      <p className="info__draft" role="note"><b>Draft.</b> This text is a plain-language draft and is being reviewed. It may change before the full launch.</p>
      {sections.map((s, i) => (
        <article key={s.h} className="info__section">
          <h2>{i + 1}. {s.h}</h2>
          {s.p.map((text) => <p key={text}>{text}</p>)}
        </article>
      ))}
    </InfoPage>
  )
}
