import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchProducts } from '@/store/slices/productSlice'
import {
  ArrowRight, Shield, Truck, RefreshCw, Headphones, Star,
  TrendingUp, Zap, Download, FileText, BookOpen, ChevronLeft,
  ChevronRight as ChevronRightIcon, Sparkles, Eye, Calendar,
  Instagram, Twitter, Facebook, Youtube, ShoppingBag, Package
} from 'lucide-react'
import ProductCard, { ProductCardSkeleton } from '@/components/product/ProductCard'
import api from '@/api/axios'

const TRUST_BADGES = [
  { icon: Truck,       label: 'Free Shipping',  sub: 'Orders above ₹500' },
  { icon: RefreshCw,   label: 'Easy Returns',   sub: '30-day policy' },
  { icon: Shield,      label: 'Secure Pay',     sub: '100% protected' },
  { icon: Headphones,  label: '24/7 Support',   sub: 'Always here' },
]

/* ── Hero with auto-sliding banners ── */
function HeroSection({ banners = [], settings = {} }) {
  const [idx, setIdx] = useState(0)
  const timer = useRef()

  useEffect(() => {
    if (banners.length < 2) return
    timer.current = setInterval(() => setIdx(i => (i + 1) % banners.length), 5000)
    return () => clearInterval(timer.current)
  }, [banners.length])

  const prev = () => { clearInterval(timer.current); setIdx(i => (i - 1 + banners.length) % banners.length) }
  const next = () => { clearInterval(timer.current); setIdx(i => (i + 1) % banners.length) }

  const stats = settings.hero_stats?.length > 0
    ? settings.hero_stats
    : [{ value: '50K+', label: 'Products' }, { value: '200K+', label: 'Customers' }, { value: '4.8★', label: 'Rating' }]

  const banner = banners[idx]

  return (
    <section className="relative overflow-hidden bg-gray-900 text-white min-h-[520px] flex flex-col">
      {/* Background */}
      {banner?.image
        ? <div className="absolute inset-0"><img src={banner.image} alt="" className="w-full h-full object-cover opacity-40 transition-all duration-700" /></div>
        : <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-primary-950 to-gray-900" />
      }
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      {/* Orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex items-center w-full">
        <div className="max-w-2xl">
          {banner?.badge_text && (
            <span className="inline-flex items-center gap-1.5 bg-primary-500/20 border border-primary-400/30 text-primary-300 text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" /> {banner.badge_text}
            </span>
          )}
          {!banner && (
            <span className="inline-flex items-center gap-1.5 bg-primary-500/20 border border-primary-400/30 text-primary-300 text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" /> New Season — Up to 70% Off
            </span>
          )}

          <h1 className="font-display font-bold leading-[1.05] mb-5 transition-all duration-500"
            style={{ fontSize:'clamp(2.4rem,5vw,4rem)', color: banner?.text_color || undefined }}>
            {banner?.title || (<>Shop <span className="text-primary-400">Premium</span><br/>Products</>)}
          </h1>

          <p className="text-gray-300 text-base lg:text-lg mb-8 leading-relaxed max-w-lg">
            {banner?.subtitle || 'Discover thousands of curated products. Quality guaranteed, delivered fast.'}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to={banner?.link_url || '/products'} className="btn-primary px-7 py-3.5 text-base shadow-primary">
              {banner?.link_text || 'Shop Now'} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/products?new_arrival=true"
              className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-all text-base">
              <Sparkles className="w-4 h-4" /> New Arrivals
            </Link>
          </div>

          <div className="flex gap-8 mt-10">
            {stats.map((s, i) => (
              <div key={i}>
                <p className="font-display font-extrabold text-2xl text-white">{s.value}</p>
                <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slide controls */}
      {banners.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-10">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/30 hover:bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm transition-all z-10">
            <ChevronRightIcon className="w-5 h-5 text-white" />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-primary-400' : 'w-1.5 bg-white/40'}`} />
            ))}
          </div>
        </>
      )}

      {/* Trust bar */}
      <div className="relative border-t border-white/10 bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-white leading-tight">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Mid banners (dynamic from admin) ── */
function MidBanners({ banners }) {
  if (!banners.length) return (
    /* fallback static banners */
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      <div className="grid md:grid-cols-3 gap-5">
        {[
          { bg:'from-orange-500 to-rose-500', title:'Flash Sale', sub:'Up to 50% off today only', link:'/products?on_sale=true', img:'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=300&fit=crop' },
          { bg:'from-violet-600 to-indigo-600', title:'New Season', sub:'Fresh arrivals every week', link:'/products?new_arrival=true', img:'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=300&fit=crop' },
          { bg:'from-emerald-500 to-teal-600', title:'Top Brands', sub:'Genuine products, great prices', link:'/products', img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=300&fit=crop' },
        ].map(b => (
          <Link key={b.title} to={b.link}
            className="relative rounded-2xl overflow-hidden h-40 group block shadow-md hover:shadow-xl transition-shadow">
            <img src={b.img} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className={`absolute inset-0 bg-gradient-to-r ${b.bg} opacity-75`} />
            <div className="absolute inset-0 flex flex-col justify-end p-5">
              <h3 className="font-display font-bold text-white text-xl leading-tight">{b.title}</h3>
              <p className="text-white/80 text-xs mt-0.5">{b.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      <div className={`grid gap-5 ${banners.length === 1 ? 'grid-cols-1' : banners.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {banners.slice(0, 3).map(b => (
          <Link key={b.id} to={b.link_url || '#'}
            className="relative rounded-2xl overflow-hidden h-40 group block shadow-md hover:shadow-xl transition-shadow"
            style={{ backgroundColor: b.bg_color || '#1f2937' }}>
            {b.image && <img src={b.image} alt={b.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60" />}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5">
              {b.badge_text && <span className="text-xs font-bold text-primary-300 mb-1 uppercase tracking-widest">{b.badge_text}</span>}
              <h3 className="font-display font-bold text-white text-xl leading-tight" style={{ color: b.text_color || undefined }}>{b.title}</h3>
              {b.subtitle && <p className="text-white/70 text-xs mt-0.5">{b.subtitle}</p>}
              {b.link_text && <span className="mt-2 text-xs font-semibold text-white flex items-center gap-1">{b.link_text} <ArrowRight className="w-3 h-3" /></span>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ── Categories ── */
function CategoryGrid({ categories }) {
  const FALLBACK_IMGS = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&h=400&fit=crop',
  ]
  const FALLBACK_NAMES = ['Fashion', 'Photography', 'Electronics', 'Clothing', 'Home', 'Footwear']
  const items = categories.length > 0 ? categories.slice(0, 6) : FALLBACK_NAMES.map((n, i) => ({ id: i, name: n, image: FALLBACK_IMGS[i] }))

  return (
    <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-primary-500 font-bold text-xs uppercase tracking-widest mb-1">Browse by</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">Shop by Category</h2>
        </div>
        <Link to="/products" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
          All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
        {items.map((cat, i) => (
          <Link key={cat.id} to={cat.id && typeof cat.id === 'string' ? `/products?category=${cat.id}` : '/products'}
            className="group flex flex-col items-center text-center gap-2.5">
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-all">
              <img src={cat.image || FALLBACK_IMGS[i % FALLBACK_IMGS.length]} alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <span className="text-xs font-semibold text-gray-700 group-hover:text-primary-600 transition-colors leading-tight">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

/* ── New Arrivals section ── */
function NewArrivalsSection({ products, loading }) {
  const scrollRef = useRef()
  const scroll = dir => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })
  }

  return (
    <section className="py-14 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest">Just Dropped</p>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">New Arrivals</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => scroll(-1)} className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:border-primary-500 hover:text-primary-500 transition-colors shadow-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => scroll(1)} className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:border-primary-500 hover:text-primary-500 transition-colors shadow-sm">
              <ChevronRightIcon className="w-4 h-4" />
            </button>
            <Link to="/products?new_arrival=true" className="ml-2 text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x">
          {loading
            ? Array(6).fill(0).map((_, i) => (
                <div key={i} className="flex-none w-52 snap-start">
                  <ProductCardSkeleton />
                </div>
              ))
            : products.length > 0
              ? products.map(p => (
                  <div key={p.id} className="flex-none w-52 snap-start">
                    <ProductCard product={p} />
                  </div>
                ))
              : Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex-none w-52 snap-start">
                    <div className="card overflow-hidden">
                      <div className="aspect-square bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-emerald-300" />
                      </div>
                      <div className="p-3">
                        <div className="h-3 bg-gray-100 rounded mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))
          }
        </div>
      </div>
    </section>
  )
}

/* ── Featured Products ── */
function FeaturedSection({ products, loading }) {
  return (
    <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            <p className="text-primary-500 font-bold text-xs uppercase tracking-widest">Trending</p>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">Featured Products</h2>
        </div>
        <Link to="/products?featured=true" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {loading
          ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.length > 0
            ? products.map(p => <ProductCard key={p.id} product={p} />)
            : Array(4).fill(0).map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <Star className="w-8 h-8 text-gray-300" />
                  </div>
                  <div className="p-4">
                    <div className="h-3 bg-gray-100 rounded mb-2 w-1/2" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))
        }
      </div>
    </section>
  )
}

/* ── Blog grid (3-4 cards) ── */
function BlogSection({ blogs }) {
  if (!blogs.length) return null
  return (
    <section className="py-14 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-primary-500" />
              <p className="text-primary-500 font-bold text-xs uppercase tracking-widest">From the blog</p>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">Latest Articles</h2>
          </div>
          <Link to="/blog" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
            All Articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {blogs.map(b => (
            <Link key={b.id} to={`/blog/${b.slug || b.id}`}
              className="card overflow-hidden group hover:shadow-card-hover transition-all duration-300">
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                {b.cover_image
                  ? <img src={b.cover_image} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-10 h-10 text-gray-200" /></div>
                }
                {b.category && (
                  <span className="absolute top-2.5 left-2.5 text-xs font-bold bg-primary-500 text-white px-2.5 py-1 rounded-full">
                    {b.category.name}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm group-hover:text-primary-600 transition-colors leading-snug mb-2">{b.title}</h3>
                {b.excerpt && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{b.excerpt}</p>}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(b.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{b.view_count||0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Side banners sidebar card ── */
function SideBannerCard({ banner }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      style={{ backgroundColor: banner.bg_color || '#f3f4f6' }}>
      {banner.image && <img src={banner.image} alt={banner.title} className="w-full h-44 object-cover" />}
      <div className="p-4">
        {banner.badge_text && <span className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-1 block">{banner.badge_text}</span>}
        <h3 className="font-bold text-gray-900 text-base" style={{ color: banner.text_color || undefined }}>{banner.title}</h3>
        {banner.subtitle && <p className="text-sm text-gray-500 mt-0.5">{banner.subtitle}</p>}
        {banner.link_url && (
          <Link to={banner.link_url} className="mt-3 btn-primary text-sm py-2 inline-flex">
            {banner.link_text || 'Shop Now'} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  )
}

/* ══════════════ MAIN PAGE ══════════════ */
export default function HomePage() {
  const dispatch = useDispatch()
  const { list: featured, categories, loading: featuredLoading } = useSelector(s => s.products)
  const [heroBanners, setHeroBanners] = useState([])
  const [midBanners, setMidBanners]   = useState([])
  const [sideBanners, setSideBanners] = useState([])
  const [recentBlogs, setRecentBlogs] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [arrivLoading, setArrivLoad]  = useState(true)
  const [cmsCards, setCmsCards]       = useState([])
  const [activePopup, setActivePopup] = useState(null)
  const [settings, setSettings]       = useState({})

  useEffect(() => {
    // Store settings (logo, stats)
    api.get('/settings').then(r => setSettings(r.data.data || {})).catch(() => {})

    // Featured products
    dispatch(fetchProducts({ featured: true, limit: 8 }))

    // New arrivals
    api.get('/products?new_arrival=true&limit=10').then(r => {
      setNewArrivals(r.data.data || [])
      setArrivLoad(false)
    }).catch(() => setArrivLoad(false))

    // Banners
    api.get('/banners?position=home').then(r => setHeroBanners(r.data.data || [])).catch(() => {})
    api.get('/banners?position=mid').then(r => setMidBanners(r.data.data || [])).catch(() => {})
    api.get('/banners?position=sidebar').then(r => setSideBanners(r.data.data || [])).catch(() => {})

    // Blogs — fetch 4
    api.get('/blogs?status=published&limit=4').then(r => setRecentBlogs(r.data.data || [])).catch(() => {})

    // CMS cards
    api.get('/cms/public?show_on_home=true').then(r => setCmsCards(r.data.data || [])).catch(() => {})

    // Popup
    api.get('/banners?type=popup').then(r => {
      const popup = r.data.data?.[0]
      if (!popup) return
      const key = `popup_seen_${popup.id}`
      if (popup.popup_once_per_session && sessionStorage.getItem(key)) return
      setTimeout(() => {
        setActivePopup(popup)
        if (popup.popup_once_per_session) sessionStorage.setItem(key, '1')
      }, popup.popup_delay_ms || 3000)
    }).catch(() => {})
  }, [dispatch])

  return (
    <div>
      {/* ── Hero ── */}
      <HeroSection banners={heroBanners} settings={settings} />

      {/* ── Categories ── */}
      <CategoryGrid categories={categories} />

      {/* ── Mid banners ── */}
      <MidBanners banners={midBanners} />

      {/* ── New Arrivals ── */}
      <NewArrivalsSection products={newArrivals} loading={arrivLoading} />

      {/* ── Featured Products ── */}
      <FeaturedSection products={featured} loading={featuredLoading} />

      {/* ── Side banners + CMS cards + Blog grid ── */}
      <BlogSection blogs={recentBlogs} />

      {/* Side banners + CMS below blog if any */}
      {(sideBanners.length > 0 || cmsCards.length > 0) && (
        <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sideBanners.map(b => <SideBannerCard key={b.id} banner={b} />)}
            {cmsCards.filter(p => p.allow_download && p.downloadable_files?.length > 0).map(page => (
              <div key={page.id} className="card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-primary-500" />
                  <h3 className="font-semibold text-gray-800 text-sm">{page.title}</h3>
                </div>
                {page.excerpt && <p className="text-xs text-gray-500 mb-3">{page.excerpt}</p>}
                {page.downloadable_files.slice(0, 2).map((file, i) => (
                  <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" download={file.name}
                    className="flex items-center gap-2 p-2 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors mb-1.5">
                    <Download className="w-3.5 h-3.5 text-primary-500" />
                    <span className="text-xs font-medium text-primary-700 truncate">{file.name}</span>
                  </a>
                ))}
                <Link to={`/pages/${page.slug}`} className="text-xs text-primary-600 hover:underline font-medium mt-1 block">View page →</Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Newsletter ── */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-500 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <ShoppingBag className="w-10 h-10 text-white/80 mx-auto mb-4" />
          <h2 className="font-display text-3xl font-bold text-white mb-3">Get Exclusive Deals</h2>
          <p className="text-primary-100 mb-8">Subscribe for the best deals, new arrivals and insider offers.</p>
          <form className="flex gap-3 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-white/40 text-sm" />
            <button type="submit" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors text-sm flex-shrink-0">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* ── Popup ── */}
      {activePopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setActivePopup(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            {activePopup.image && <img src={activePopup.image} alt="" className="w-full h-48 object-cover" />}
            <div className="p-6">
              {activePopup.badge_text && <span className="badge-primary text-xs mb-2 inline-block">{activePopup.badge_text}</span>}
              <h3 className="font-display font-bold text-xl text-gray-900">{activePopup.title}</h3>
              {activePopup.subtitle && <p className="text-gray-600 mt-1 text-sm">{activePopup.subtitle}</p>}
              <div className="flex gap-3 mt-5">
                {activePopup.link_url && (
                  <Link to={activePopup.link_url} onClick={() => setActivePopup(null)} className="btn-primary flex-1 text-sm py-2.5 text-center">
                    {activePopup.link_text || 'Shop Now'}
                  </Link>
                )}
                <button onClick={() => setActivePopup(null)} className="btn-secondary flex-1 text-sm py-2.5">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
