import { useEffect, useState } from 'react'
import PropertyCard from '../../components/cards/PropertyCard'
import Button from '../../components/ui/Button'
import { useSaved } from '../../hooks/useSaved'
import { getPropertyById } from '../../services/propertyService'

export default function SavedHomes() {
  const { ids } = useSaved()
  const [homes, setHomes] = useState(null)

  useEffect(() => {
    let ignore = false
    Promise.all(ids.map(getPropertyById)).then((list) => { if (!ignore) setHomes(list.filter(Boolean)) })
    return () => { ignore = true }
  }, [ids])

  if (!homes) return <p>Loading…</p>
  return (
    <div className="overview">
      <div>
        <h1>Saved Homes</h1>
        <p>{homes.length ? `${homes.length} ${homes.length === 1 ? 'home' : 'homes'} you have saved. Tap the heart to remove one.` : 'Homes you save with the heart appear here.'}</p>
      </div>
      {homes.length > 0 ? (
        <div className="shop__grid">{homes.map((p) => <PropertyCard key={p.id} property={p} compact />)}</div>
      ) : (
        <div className="properties__empty"><h2>No saved homes yet</h2><p>Browse homes and tap the heart on the ones you like.</p><Button to="/properties">Browse homes</Button></div>
      )}
    </div>
  )
}
