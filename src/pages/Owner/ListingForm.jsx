import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { createListing, getMyListing, updateListing, uploadPhoto } from '../../services/ownerService'
import { picture } from '../../services/catalog'
import { availability, comforts, propertyTypes } from '../../data/propertyOptions'
import './Owner.css'

const MAX_PHOTOS = 10
const empty = {
  title: '', listingType: 'rent', propertyType: 'apartment', price: '', beds: '2', baths: '1', sqm: '',
  address: '', area: '', city: 'Accra', available: 'now', features: [], description: '', photos: [],
}
const cities = ['Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Cape Coast', 'Tema']

// Turns what the owner typed into what the server expects (numbers as numbers).
const toBody = (f) => ({
  ...f, price: Number(f.price), beds: Number(f.beds), baths: Number(f.baths), sqm: Number(f.sqm),
})

// Quick checks so mistakes show before sending. The server checks everything again.
function check(f) {
  const e = {}
  if (f.title.trim().length < 5) e.title = 'Give the home a title (at least 5 characters).'
  if (!(Number(f.price) > 0)) e.price = 'Enter a price above zero.'
  if (!Number.isInteger(Number(f.beds)) || f.beds === '' || Number(f.beds) < 0) e.beds = 'Enter the number of bedrooms.'
  if (!Number.isInteger(Number(f.baths)) || f.baths === '' || Number(f.baths) < 0) e.baths = 'Enter the number of bathrooms.'
  if (!(Number(f.sqm) >= 5)) e.sqm = 'Enter the size in square metres.'
  if (f.address.trim().length < 5) e.address = 'Enter the street address.'
  if (f.area.trim().length < 2) e.area = 'Enter the area or neighbourhood.'
  if (f.city.trim().length < 2) e.city = 'Enter the city.'
  if (f.description.trim().length < 20) e.description = 'Describe the home in at least 20 characters.'
  if (f.photos.length < 1) e.photos = 'Add at least one photo.'
  return e
}

export default function ListingForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const fileInput = useRef(null)
  const [form, setForm] = useState(empty)
  const [loaded, setLoaded] = useState(!editing)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(0)
  const [loadError, setLoadError] = useState('')
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  useEffect(() => {
    if (!editing) return undefined
    let ignore = false
    getMyListing(id)
      .then((l) => {
        if (ignore) return
        const h = l.listing
        setForm({
          title: h.title, listingType: h.listingType, propertyType: h.propertyType, price: String(h.price), beds: String(h.beds),
          baths: String(h.baths), sqm: String(h.sqm), address: h.address, area: h.area, city: h.city, available: h.available,
          features: h.features, description: h.description, photos: h.gallery,
        })
        setLoaded(true)
      })
      .catch((err) => { if (!ignore) setLoadError(err.message) })
    return () => { ignore = true }
  }, [editing, id])

  async function addPhotos(files) {
    const room = MAX_PHOTOS - form.photos.length
    const chosen = [...files].slice(0, room)
    if (files.length > room) setErrors((e) => ({ ...e, photos: `You can add up to ${MAX_PHOTOS} photos.` }))
    for (const file of chosen) {
      setUploading((n) => n + 1)
      try {
        const key = await uploadPhoto(file)
        setForm((f) => ({ ...f, photos: [...f.photos, key] }))
        setErrors((e) => ({ ...e, photos: undefined }))
      } catch (err) {
        setErrors((e) => ({ ...e, photos: err.message }))
      }
      setUploading((n) => n - 1)
    }
    if (fileInput.current) fileInput.current.value = ''
  }

  const makeCover = (key) => set({ photos: [key, ...form.photos.filter((k) => k !== key)] })
  const removePhoto = (key) => set({ photos: form.photos.filter((k) => k !== key) })
  const toggleFeature = (fid) => set({ features: form.features.includes(fid) ? form.features.filter((x) => x !== fid) : [...form.features, fid] })

  async function submit(e) {
    e.preventDefault()
    const found = check(form)
    setErrors(found)
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const body = toBody(form)
      if (editing) await updateListing(id, body)
      else await createListing(body)
      navigate('/owner', { state: { notice: editing ? 'Saved. Your listing is back in review.' : 'Submitted. We will review your listing and it goes live once approved.' } })
    } catch (err) {
      setErrors({ form: err.message, ...err.fields })
      setBusy(false)
    }
  }

  if (loadError) return <p className="op__error" role="alert">{loadError} <Link to="/owner">Back to my listings</Link></p>
  if (!loaded) return <p>Loading…</p>

  const field = (name, label, input, hint) => (
    <label className="of__field">
      <span>{label}</span>
      {input}
      {hint && <small>{hint}</small>}
      {errors[name] && <em>{errors[name]}</em>}
    </label>
  )
  const text = (name, props = {}) => (
    <input value={form[name]} onChange={(e) => set({ [name]: e.target.value })} aria-invalid={Boolean(errors[name])} {...props} />
  )

  return (
    <form className="op of" onSubmit={submit} noValidate>
      <header className="op__head">
        <div>
          <h1>{editing ? 'Edit your listing' : 'Post a property'}</h1>
          <p>{editing ? 'Saving sends the listing back for review before it shows again.' : 'Tell people about your home. We review every listing before it goes live.'}</p>
        </div>
        <Link to="/owner" className="op__back">Cancel</Link>
      </header>

      <section className="of__panel">
        <h2>The basics</h2>
        <div className="of__grid">
          {field('title', 'Listing title', text('title', { maxLength: 100, placeholder: 'Bright two-bedroom flat in Osu' }))}
          {field('listingType', 'This home is for', (
            <select value={form.listingType} onChange={(e) => set({ listingType: e.target.value })}>
              <option value="rent">Rent (per month)</option>
              <option value="buy">Sale</option>
            </select>
          ))}
          {field('propertyType', 'Type of home', (
            <select value={form.propertyType} onChange={(e) => set({ propertyType: e.target.value })}>
              {propertyTypes.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          ))}
          {field('price', form.listingType === 'rent' ? 'Rent per month (GH₵)' : 'Sale price (GH₵)', text('price', { type: 'number', min: 1, inputMode: 'decimal' }))}
          {field('available', 'Available', (
            <select value={form.available} onChange={(e) => set({ available: e.target.value })}>
              {availability.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          ))}
        </div>
      </section>

      <section className="of__panel">
        <h2>Size and place</h2>
        <div className="of__grid of__grid--3">
          {field('beds', 'Bedrooms', text('beds', { type: 'number', min: 0, max: 20 }))}
          {field('baths', 'Bathrooms', text('baths', { type: 'number', min: 0, max: 20 }))}
          {field('sqm', 'Size (sq m)', text('sqm', { type: 'number', min: 5 }))}
        </div>
        <div className="of__grid">
          {field('address', 'Street address', text('address', { maxLength: 200, autoComplete: 'street-address' }))}
          {field('area', 'Area / neighbourhood', text('area', { maxLength: 80 }))}
          {field('city', 'City', (
            <>
              <input list="of-cities" value={form.city} onChange={(e) => set({ city: e.target.value })} aria-invalid={Boolean(errors.city)} maxLength={60} />
              <datalist id="of-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
            </>
          ))}
        </div>
      </section>

      <section className="of__panel">
        <h2>Comforts</h2>
        <div className="of__checks">
          {comforts.map((c) => (
            <label key={c.id}>
              <input type="checkbox" checked={form.features.includes(c.id)} onChange={() => toggleFeature(c.id)} /> {c.label}
            </label>
          ))}
        </div>
        {errors.features && <p className="op__error">{errors.features}</p>}
      </section>

      <section className="of__panel">
        <h2>Description</h2>
        {field('description', 'Tell visitors about the home', (
          <textarea rows={6} maxLength={2000} value={form.description} onChange={(e) => set({ description: e.target.value })} aria-invalid={Boolean(errors.description)} />
        ), `${form.description.length} / 2000. Leave a blank line between paragraphs.`)}
      </section>

      <section className="of__panel">
        <h2>Photos</h2>
        <p className="of__hint">Add up to {MAX_PHOTOS} photos. The first photo is the cover. Photos are shrunk automatically.</p>
        <ul className="of__photos">
          {form.photos.map((key, i) => (
            <li key={key}>
              <img src={picture(key)} alt={`Photo ${i + 1}`} />
              {i === 0 ? <span className="of__cover">Cover</span> : <button type="button" onClick={() => makeCover(key)}>Make cover</button>}
              <button type="button" className="of__remove" onClick={() => removePhoto(key)} aria-label={`Remove photo ${i + 1}`}><Icon name="close" size={14} /></button>
            </li>
          ))}
          {uploading > 0 && <li className="of__uploading">Uploading {uploading}…</li>}
          {form.photos.length + uploading < MAX_PHOTOS && (
            <li>
              <button type="button" className="of__add" onClick={() => fileInput.current?.click()}>
                <Icon name="camera" size={22} /> Add photos
              </button>
            </li>
          )}
        </ul>
        <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
        {errors.photos && <p className="op__error" role="alert">{errors.photos}</p>}
      </section>

      {errors.form && <p className="op__error" role="alert">{errors.form}</p>}
      <div className="of__submit">
        <button type="submit" className="op__primary" disabled={busy || uploading > 0}>{busy ? 'Saving…' : editing ? 'Save and send for review' : 'Submit for review'}</button>
        <Link to="/owner" className="op__back">Cancel</Link>
      </div>
    </form>
  )
}
