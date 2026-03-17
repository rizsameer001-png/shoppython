import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProduct, clearCurrentProduct, fetchProducts } from '@/store/slices/productSlice'
import { addToCart } from '@/store/slices/cartSlice'
import { toggleWishlist } from '@/store/slices/wishlistSlice'
import {
  Heart, ShoppingCart, Star, Truck, RefreshCw, Shield,
  ChevronRight, ZoomIn, Play, Minus, Plus, Share2, ArrowLeft
} from 'lucide-react'
import ProductCard, { ProductCardSkeleton } from '@/components/product/ProductCard'

function StarRow({ rating, count }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(s => (
          <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`} />
        ))}
      </div>
      <span className="text-sm text-gray-500">{rating?.toFixed(1)} ({count} reviews)</span>
    </div>
  )
}

function ImageGallery({ images = [], productName }) {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }

  const imgs = images.length > 0 ? images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop']

  return (
    <div className="flex gap-4">
      <div className="hidden sm:flex flex-col gap-2.5 w-16 flex-shrink-0">
        {imgs.map((src, i) => (
          <button key={i} onClick={() => setActive(i)}
            className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-150 flex-shrink-0
              ${active === i ? 'border-primary-500 shadow-primary' : 'border-gray-200 hover:border-gray-300'}`}>
            <img src={src} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      <div className="flex-1 relative">
        <div className={`aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 relative ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
          onClick={() => setZoomed(!zoomed)}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setZoomed(false)}>
          <img src={imgs[active]} alt={productName}
            className="w-full h-full object-cover transition-transform duration-300"
            style={zoomed ? { transform: 'scale(2)', transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : {}} />
          {!zoomed && <div className="absolute bottom-3 right-3 bg-black/40 text-white rounded-lg p-1.5"><ZoomIn className="w-4 h-4" /></div>}
        </div>
        {imgs.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3 sm:hidden">
            {imgs.map((_, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === active ? 'bg-primary-500 w-4' : 'bg-gray-300'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function YouTubeEmbed({ url }) {
  const id = url?.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]
  if (!id) return null
  return (
    <div className="aspect-video rounded-2xl overflow-hidden bg-black">
      <iframe src={`https://www.youtube.com/embed/${id}`} allowFullScreen className="w-full h-full" />
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentProduct: product, productLoading, list: related } = useSelector((s) => s.products)
  const { ids: wishIds } = useSelector((s) => s.wishlist)

  const [qty, setQty]                       = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [activeTab, setActiveTab]           = useState('description')
  // selectedAttributes: { [attribute_id]: value_string }
  const [selectedAttrs, setSelectedAttrs]   = useState({})

  const isWished = wishIds.includes(product?.id)

  useEffect(() => {
    dispatch(fetchProduct(id))
    dispatch(fetchProducts({ limit: 4 }))
    return () => dispatch(clearCurrentProduct())
  }, [id, dispatch])

  useEffect(() => { window.scrollTo(0, 0) }, [id])

  // Reset selections when product changes
  useEffect(() => {
    setSelectedAttrs({})
    setSelectedVariant(null)
  }, [id])

  const toggleAttrValue = (attrId, value) => {
    setSelectedAttrs(prev => ({
      ...prev,
      [attrId]: prev[attrId] === value ? null : value,
    }))
  }

  // Build a readable attributes string for cart e.g. "Size: M, Color: Red"
  const attrSummary = product?.attributes
    ?.filter(a => a.selected_values?.length > 0 && selectedAttrs[a.attribute_id])
    .map(a => `${a.name}: ${selectedAttrs[a.attribute_id]}`)
    .join(', ') || selectedVariant || null

  const handleAddToCart = () => {
    dispatch(addToCart({
      product_id: product.id,
      quantity:   qty,
      variant:    attrSummary,
      selected_attributes: Object.entries(selectedAttrs)
        .filter(([, v]) => v)
        .map(([attribute_id, value]) => {
          const attr    = product.attributes?.find(a => a.attribute_id === attribute_id)
          // include color_hex so cart/order display shows real swatch color
          const valMeta = attr?.values_meta?.find(m => m.value === value)
          return {
            attribute_id,
            name:      attr?.name || '',
            value,
            color_hex: valMeta?.color_hex || null,
          }
        }),
    }))
  }

  const discount = product?.compare_price > product?.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  if (productLoading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className={`skeleton rounded-xl h-${i===1?10:6}`} />)}
          </div>
        </div>
      </div>
    )
  }

  const attrs = product.attributes?.filter(a => a.selected_values?.length > 0) || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
        <Link to="/" className="hover:text-primary-500 transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/products" className="hover:text-primary-500 transition-colors">Products</Link>
        {product.category && <>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/products?category=${product.category_id}`} className="hover:text-primary-500 transition-colors">{product.category.name}</Link>
        </>}
        <ChevronRight className="w-3 h-3" />
        <span className="text-gray-700 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12 mb-16">
        {/* Gallery */}
        <div className="space-y-4">
          <ImageGallery images={product.images} productName={product.name} />
          {product.youtube_url && <YouTubeEmbed url={product.youtube_url} />}
          {product.video_url && !product.youtube_url && (
            <video src={product.video_url} controls className="w-full rounded-2xl" />
          )}
        </div>

        {/* Buy box */}
        <div className="space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {product.is_new_arrival && <span className="badge bg-emerald-500 text-white">NEW</span>}
            {product.is_on_sale && <span className="badge bg-red-500 text-white">SALE</span>}
            {product.is_featured && <span className="badge bg-primary-500 text-white">FEATURED</span>}
            {product.stock === 0 && <span className="badge bg-gray-500 text-white">OUT OF STOCK</span>}
          </div>

          {product.brand && <p className="text-primary-500 font-semibold text-sm uppercase tracking-widest">{product.brand.name}</p>}

          <h1 className="font-display text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">{product.name}</h1>

          <StarRow rating={product.avg_rating} count={product.review_count} />

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="font-display text-4xl font-bold text-primary-600">₹{product.price?.toLocaleString()}</span>
            {product.compare_price > product.price && (
              <>
                <span className="text-xl text-gray-400 line-through font-semibold">₹{product.compare_price?.toLocaleString()}</span>
                <span className="badge bg-red-100 text-red-600 font-bold">{discount}% OFF</span>
              </>
            )}
          </div>

          {product.short_description && (
            <p className="text-gray-600 text-sm leading-relaxed border-l-4 border-primary-200 pl-3">{product.short_description}</p>
          )}

          {/* ── SELECTABLE ATTRIBUTES ── shown before quantity ── */}
          {attrs.map(attr => (
            <div key={attr.attribute_id} className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-800">{attr.name}</p>
                {selectedAttrs[attr.attribute_id] && (
                  <span className="text-xs text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded-full">
                    {selectedAttrs[attr.attribute_id]}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {attr.selected_values.map(v => {
                  const isSelected = selectedAttrs[attr.attribute_id] === v
                  // Look up hex from values_meta (stored with the product) or fall back
                  const hex = attr.values_meta?.find(m => m.value === v)?.color_hex || null
                  return attr.type === 'color' ? (
                    /* Color swatch — circle with actual hex from admin */
                    <button key={v} type="button"
                      onClick={() => toggleAttrValue(attr.attribute_id, v)}
                      title={v}
                      className={`w-9 h-9 rounded-full border-2 transition-all duration-150 hover:scale-110 flex-shrink-0 relative
                        ${isSelected ? 'border-primary-500 ring-2 ring-primary-300 ring-offset-2' : 'border-gray-300 hover:border-gray-500'}`}
                      style={{ backgroundColor: hex || (v.startsWith('#') ? v : '#d1d5db') }}
                    >
                      {/* tick on selected */}
                      {isSelected && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                    </button>
                  ) : (
                    /* Size / text chip */
                    <button key={v} type="button"
                      onClick={() => toggleAttrValue(attr.attribute_id, v)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all duration-150
                        ${isSelected
                          ? 'border-primary-500 bg-primary-500 text-white shadow-primary'
                          : 'border-gray-200 text-gray-700 hover:border-primary-400 hover:text-primary-600 bg-white'}`}>
                      {v}
                    </button>
                  )
                })}
              </div>
              {/* Size chart */}
              {attr.size_chart && (
                <details className="mt-1">
                  <summary className="text-xs text-primary-500 cursor-pointer font-semibold hover:text-primary-700">📏 View size chart</summary>
                  <div className="overflow-x-auto mt-2 rounded-xl border border-gray-200">
                    <table className="text-xs border-collapse w-full">
                      <thead><tr className="bg-gray-50">
                        {attr.size_chart.cols.map((c, ci) => <th key={ci} className="border border-gray-200 px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">{c}</th>)}
                      </tr></thead>
                      <tbody>{attr.size_chart.data.map((row, ri) => (
                        <tr key={ri}>{row.map((cell, ci) => (
                          <td key={ci} className={`border border-gray-200 px-3 py-2 text-gray-600 ${ci===0?'font-semibold bg-gray-50':''}`}>{cell}</td>
                        ))}</tr>
                      ))}</tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          ))}

          {/* Variants (legacy) */}
          {product.variants?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Select Variant</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => (
                  <button key={v.name} onClick={() => setSelectedVariant(v.name)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all
                      ${selectedVariant === v.name ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Qty + Add to Cart */}
          <div className="flex gap-3 items-center pt-2">
            <div className="flex items-center bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-4 py-3 hover:bg-gray-200 transition-colors">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-gray-900">{qty}</span>
              <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))} className="px-4 py-3 hover:bg-gray-200 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button onClick={handleAddToCart} disabled={product.stock === 0} className="btn-primary flex-1 py-3">
              <ShoppingCart className="w-5 h-5" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>

            <button onClick={() => dispatch(toggleWishlist(product.id))}
              className={`p-3 rounded-xl border-2 transition-all duration-200 flex-shrink-0
                ${isWished ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'}`}>
              <Heart className={`w-5 h-5 ${isWished ? 'fill-current' : ''}`} />
            </button>
          </div>

          {product.stock > 0 && product.stock <= 10 && (
            <p className="text-orange-500 text-sm font-semibold">⚡ Only {product.stock} left in stock!</p>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            {[
              [Truck,     'Free Shipping', 'Orders over ₹500'],
              [RefreshCw, 'Easy Returns',  '30-day policy'],
              [Shield,    'Secure Pay',    '100% protected'],
            ].map(([Icon, label, sub]) => (
              <div key={label} className="flex flex-col items-center text-center gap-1 p-2">
                <Icon className="w-5 h-5 text-primary-500" />
                <p className="text-xs font-semibold text-gray-700">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs — description / details / reviews only (attributes shown in buy box) */}
      <div className="mb-16">
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 w-fit mb-6">
          {['description', 'details', 'reviews'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200
                ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'description' && (
          <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
            <p>{product.description || 'No description available.'}</p>
          </div>
        )}
        {activeTab === 'details' && (
          <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
            {[
              ['SKU',      product.sku || '—'],
              ['Brand',    product.brand?.name || '—'],
              ['Category', product.category?.name || '—'],
              ['Weight',   product.weight ? `${product.weight}kg` : '—'],
              ['Stock',    product.stock ?? '—'],
              ['Tags',     product.tags?.join(', ') || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-100 text-sm">
                <span className="text-gray-500 font-medium">{label}</span>
                <span className="text-gray-800 font-semibold">{value}</span>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'reviews' && (
          <div className="text-center py-10 text-gray-400">
            <Star className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="font-semibold">Reviews coming soon</p>
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="section-title mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.filter(p => p.id !== product.id).slice(0, 4).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
