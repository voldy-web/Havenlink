import { useEffect, useState } from 'react'
import Icon from '../../components/ui/Icon'
import './PropertyGallery.css'

// One large photo plus up to four small ones. Clicking any photo opens a
// full-screen viewer with previous/next buttons and keyboard arrows.
export default function PropertyGallery({ photos }) {
  const [openIndex, setOpenIndex] = useState(null)
  const isOpen = openIndex !== null

  // Keyboard controls while the viewer is open: Esc closes, arrows move.
  useEffect(() => {
    if (!isOpen) return undefined
    function onKey(e) {
      if (e.key === 'Escape') setOpenIndex(null)
      if (e.key === 'ArrowRight') setOpenIndex((i) => (i + 1) % photos.length)
      if (e.key === 'ArrowLeft') setOpenIndex((i) => (i - 1 + photos.length) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, photos.length])

  const [main, ...rest] = photos
  const thumbs = rest.slice(0, 4)

  return (
    <>
      <div className={`gallery gallery--${Math.min(photos.length, 5)}`}>
        <button className="gallery__main" onClick={() => setOpenIndex(0)}>
          <img src={main.src} alt={main.caption} />
          <span className="gallery__caption">{main.caption}</span>
        </button>

        {thumbs.map((photo, i) => (
          <button key={photo.caption} className="gallery__thumb" onClick={() => setOpenIndex(i + 1)}>
            <img src={photo.src} alt={photo.caption} loading="lazy" />
          </button>
        ))}

        <button className="gallery__all" onClick={() => setOpenIndex(0)}>
          <Icon name="camera" size={14} /> View All {photos.length} Photos
        </button>
      </div>

      {isOpen && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={() => setOpenIndex(null)}
        >
          <button className="lightbox__close" aria-label="Close" onClick={() => setOpenIndex(null)}>
            <Icon name="close" size={20} />
          </button>
          <button
            className="lightbox__nav lightbox__nav--prev"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation()
              setOpenIndex((openIndex - 1 + photos.length) % photos.length)
            }}
          >
            <Icon name="chevronLeft" size={22} />
          </button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={photos[openIndex].src} alt={photos[openIndex].caption} />
            <figcaption>
              {photos[openIndex].caption} ({openIndex + 1} / {photos.length})
            </figcaption>
          </figure>
          <button
            className="lightbox__nav lightbox__nav--next"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation()
              setOpenIndex((openIndex + 1) % photos.length)
            }}
          >
            <Icon name="chevronRight" size={22} />
          </button>
        </div>
      )}
    </>
  )
}
