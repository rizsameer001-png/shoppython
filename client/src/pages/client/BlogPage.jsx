import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar, Eye, Tag, Search, Grid, List } from 'lucide-react'
import { useSelector } from 'react-redux'
import api from '@/api/axios'

export default function BlogPage() {
  const [blogs, setBlogs]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [total, setTotal]       = useState(0)
  const [viewMode, setViewMode] = useState('grid')
  const [searchParams, setSearchParams] = useSearchParams()
  const { categories }          = useSelector(s => s.products)

  const page = Number(searchParams.get('page')) || 1
  const cat  = searchParams.get('category') || ''
  const search = searchParams.get('search') || ''
  const limit = 9

  useEffect(() => {
    setLoading(true)
    const params = { status: 'published', page, limit }
    if (cat)    params.category_id = cat
    if (search) params.search = search
    api.get('/blogs', { params })
      .then(r => { setBlogs(r.data.data); setTotal(r.data.pagination?.total || 0) })
      .finally(() => setLoading(false))
  }, [page, cat, search])

  const setFilter = (k, v) => {
    const p = new URLSearchParams(searchParams)
    v ? p.set(k, v) : p.delete(k)
    p.set('page', '1')
    setSearchParams(p)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="section-title mb-3">Blog & Articles</h1>
        <p className="text-gray-500 max-w-xl mx-auto">Tips, guides and news from MarketPro</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-8">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9 text-sm py-2.5 w-full" placeholder="Search articles..."
            defaultValue={search}
            onKeyDown={e => e.key === 'Enter' && setFilter('search', e.target.value)} />
        </div>
        <select className="input text-sm py-2.5 w-44" value={cat} onChange={e => setFilter('category', e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg ml-auto">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode==='grid'?'bg-white shadow-sm text-primary-500':'text-gray-400'}`}><Grid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode==='list'?'bg-white shadow-sm text-primary-500':'text-gray-400'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className={`grid gap-6 ${viewMode==='grid'?'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3':'grid-cols-1'}`}>
          {Array(6).fill(0).map((_,i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No articles found.</div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map(b => (
            <Link key={b.id} to={`/blog/${b.slug || b.id}`} className="card overflow-hidden group hover:shadow-card-hover transition-shadow">
              <div className="aspect-video bg-gray-100 overflow-hidden">
                {b.cover_image
                  ? <img src={b.cover_image} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-200 text-5xl">📝</div>}
              </div>
              <div className="p-5">
                {b.category && <p className="text-xs text-primary-500 font-semibold uppercase tracking-wide mb-1">{b.category.name}</p>}
                <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">{b.title}</h3>
                {b.excerpt && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{b.excerpt}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(b.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{b.view_count||0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {blogs.map(b => (
            <Link key={b.id} to={`/blog/${b.slug || b.id}`} className="card p-5 flex gap-4 hover:shadow-card-hover transition-shadow group">
              {b.cover_image && <img src={b.cover_image} alt={b.title} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                {b.category && <p className="text-xs text-primary-500 font-semibold uppercase tracking-wide mb-1">{b.category.name}</p>}
                <h3 className="font-semibold text-gray-800 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">{b.title}</h3>
                {b.excerpt && <p className="text-sm text-gray-500 line-clamp-2 mb-2">{b.excerpt}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(b.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{b.view_count||0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: Math.ceil(total/limit) }, (_,i) => i+1).map(p => (
            <button key={p} onClick={() => setFilter('page', p)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all
                ${p===page ? 'bg-primary-500 text-white shadow-primary' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
