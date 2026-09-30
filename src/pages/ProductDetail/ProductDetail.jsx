import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import ProductCard from '../../components/cards/ProductCard'
import ProductImage from '../../components/ui/ProductImage'
import { useCart } from '../../hooks/useCart'
import { getProductById, getRelatedProducts } from '../../services/productService'
import { defaultChoices, unitPriceFor, swatchColors } from '../../utils/productHelpers'
import { categories } from '../../data/shopOptions'
import { formatPrice } from '../../utils/format'
import { FREE_DELIVERY_OVER, DELIVERY_FEE } from '../../services/orderService'
import './ProductDetail.css'

const tabs = ['Overview', 'Specifications', 'Delivery & Returns']

export default function ProductDetail() {
  const { id } = useParams()
  const { addItem } = useCart()
  const [data, setData] = useState({ id: null, product: null, related: [] })

  useEffect(() => {
    let ignore = false
    async function load() {
      const product = await getProductById(id)
      const related = product ? await getRelatedProducts(product) : []
      return { id, product, related }
    }
    load().then((r) => { if (!ignore) setData(r) })
    return () => { ignore = true }
  }, [id])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  const { product, related } = data
  if (data.id !== id) return <div className="container product"><p>Loading…</p></div>
  if (!product) {
    return (
      <section className="container product product--empty">
        <h1>Product not found</h1>
        <p>This item may have been removed or the link is incorrect.</p>
        <Button to="/shop">Back to the Shop</Button>
      </section>
    )
  }

  // `key={product.id}` makes the buying panel start fresh for each product.
  return (
    <div className="container product">
      <nav className="product__crumbs" aria-label="Breadcrumb">
        <Link to="/">Home</Link> › <Link to="/shop">Shop</Link> ›{' '}
        <Link to={`/shop?category=${product.category}`}>
          {categories.find((c) => c.id === product.category)?.label}
        </Link> › <span>{product.name}</span>
      </nav>

      <ProductBuy key={product.id} product={product} addItem={addItem} />

      {related.length > 0 && (
        <section className="product__related">
          <h2>You May Also Like</h2>
          <div className="shop__grid">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function ProductBuy({ product, addItem }) {
  const photos = useMemo(() => product.gallery || [product.image || null], [product])
  const [photo, setPhoto] = useState(0)
  const [choices, setChoices] = useState(() => defaultChoices(product))
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [tab, setTab] = useState(tabs[0])
  const [saved, setSaved] = useState(false)

  const unit = unitPriceFor(product, choices)
  const inStock = product.stock > 0

  function add() {
    addItem(product.id, unit, qty, choices)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <>
      <div className="product__top">
        <div className="product__gallery">
          <div className="product__photo">
            <ProductImage product={product} src={photos[photo] ?? undefined} />
            <span className="product__badge">{product.badge}</span>
            <button
              className={`product__heart ${saved ? 'is-saved' : ''}`}
              aria-label={saved ? 'Remove from saved' : 'Save item'}
              aria-pressed={saved}
              onClick={() => setSaved(!saved)}
            >
              <Icon name="heart" size={18} />
            </button>
          </div>
          {photos.length > 1 && photos[0] && (
            <div className="product__thumbs">
              {photos.map((src, i) => (
                <button
                  key={src}
                  className={photo === i ? 'is-active' : ''}
                  aria-label={`Show photo ${i + 1}`}
                  aria-pressed={photo === i}
                  onClick={() => setPhoto(i)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product__info">
          <div className="product__meta">
            <span>SKU: {product.sku} · {product.vendor.toUpperCase()}</span>
            <b className={inStock ? 'is-in' : 'is-out'}>
              {inStock ? `In Stock · ${product.stock} Available` : 'Out of Stock'}
            </b>
          </div>
          <h1>{product.name}</h1>
          <p className="product__lead">{product.description}</p>
          <p className="product__rating">
            <span aria-hidden="true">{[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" size={16} />)}</span>
            <b>{product.rating}</b> ({product.reviews} verified reviews)
          </p>

          <div className="product__price">
            <strong>{formatPrice(unit)}</strong>
            {product.oldPrice && (
              <>
                <s>{formatPrice(product.oldPrice)}</s>
                <em>Save {formatPrice(product.oldPrice - product.price)}</em>
              </>
            )}
          </div>

          {(product.options || []).map((group) => (
            <div key={group.name} className="product__option">
              <p>{group.name}: <b>{choices[group.name]}</b></p>
              <div className={swatchColors[group.choices[0].label] ? 'swatches' : 'choices'}>
                {group.choices.map((c) => {
                  const active = choices[group.name] === c.label
                  return swatchColors[c.label] ? (
                    <button
                      key={c.label}
                      type="button"
                      className={active ? 'is-active' : ''}
                      style={{ background: swatchColors[c.label] }}
                      aria-label={c.label}
                      aria-pressed={active}
                      onClick={() => setChoices({ ...choices, [group.name]: c.label })}
                    >
                      {active && <Icon name="check" size={16} />}
                    </button>
                  ) : (
                    <button
                      key={c.label}
                      type="button"
                      className={active ? 'is-active' : ''}
                      aria-pressed={active}
                      onClick={() => setChoices({ ...choices, [group.name]: c.label })}
                    >
                      <b>{c.label}</b>
                      <small>{c.extra ? `+${formatPrice(c.extra)}` : 'Included'}</small>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="product__buy">
            <div className="qty" role="group" aria-label="Quantity">
              <button aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty(qty - 1)}><Icon name="minus" size={14} /></button>
              <span aria-live="polite">{qty}</span>
              <button aria-label="Increase quantity" disabled={qty >= Math.min(10, product.stock)} onClick={() => setQty(qty + 1)}><Icon name="plus" size={14} /></button>
            </div>
            <button className="product__add" disabled={!inStock} onClick={add}>
              <Icon name={added ? 'check' : 'bag'} size={16} />
              {added ? 'Added to cart' : `Add to Cart (${formatPrice(unit * qty)})`}
            </button>
          </div>
          {added && (
            <p className="product__added" role="status">
              Added. <Link to="/cart">View your cart</Link> or keep shopping.
            </p>
          )}

          <ul className="product__perks">
            <li><Icon name="truck" size={18} /> <span><b>{product.delivery}.</b> Free delivery over {formatPrice(FREE_DELIVERY_OVER)}, otherwise {formatPrice(DELIVERY_FEE)}.</span></li>
            <li><Icon name="shield" size={18} /> <span><b>Warranty:</b> {product.specs.find(([k]) => k === 'Warranty')?.[1] || 'Covered by the vendor'}.</span></li>
          </ul>
        </div>
      </div>

      <section className="product__tabs">
        <div role="tablist" className="product__tablist">
          {tabs.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'is-active' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Overview' && (
          <div className="product__panel">
            <h2>{product.feature}</h2>
            <p>{product.description}</p>
            <ul className="product__facts">
              <li><b>{product.dims}</b><small>Dimensions</small></li>
              <li><b>{product.material}</b><small>Material</small></li>
              <li><b>{product.vendor}</b><small>Vendor</small></li>
            </ul>
          </div>
        )}
        {tab === 'Specifications' && (
          <dl className="product__specs">
            {product.specs.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        )}
        {tab === 'Delivery & Returns' && (
          <div className="product__panel">
            <h2>Delivery to your home</h2>
            <p>
              Choose a delivery day at checkout. Delivery is free on orders over {formatPrice(FREE_DELIVERY_OVER)},
              otherwise it costs {formatPrice(DELIVERY_FEE)}. You can pay online or when the order arrives.
            </p>
            <p>Please check the item on delivery. If something is wrong, tell the delivery team or contact us within 7 days.</p>
          </div>
        )}
      </section>
    </>
  )
}
