import Icon from './Icon'
import './Pagination.css'

// Page numbers with previous/next arrows. Shows at most: first page,
// the pages around the current one, and the last page ("1 ... 4 5 6 ... 12").
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const pages = []
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || Math.abs(n - page) <= 1) pages.push(n)
    else if (pages[pages.length - 1] !== '...') pages.push('...')
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        <Icon name="chevronLeft" size={14} />
      </button>

      {pages.map((n, i) =>
        n === '...' ? (
          <span key={`gap-${i}`} className="pagination__gap">…</span>
        ) : (
          <button
            key={n}
            className={n === page ? 'is-active' : ''}
            aria-current={n === page ? 'page' : undefined}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ),
      )}

      <button
        aria-label="Next page"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        <Icon name="chevronRight" size={14} />
      </button>
    </nav>
  )
}
