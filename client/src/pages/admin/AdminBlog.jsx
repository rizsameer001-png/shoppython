import { useEffect, useState, useRef } from 'react'
import { Plus, Edit, Trash2, Eye, Grid, List, Search, BookOpen, Calendar, Tag, X, Save, Upload, Video, Image as ImageIcon } from 'lucide-react'
import { useSelector } from 'react-redux'
import api from '@/api/axios'
import toast from 'react-hot-toast'

const EMPTY_FORM = {
  title:'', slug:'', content:'', excerpt:'', cover_image:'',
  category_id:'', tags:[], status:'draft', youtube_url:'', video_url:'',
  is_featured:false, meta_title:'', meta_description:'',
}

function slugify(t) {
  return t.toLowerCase().trim().replace(/[^\w\s-]/g,'').replace(/[\s_-]+/g,'-')
}

export default function AdminBlog() {
  const { categories } = useSelector(s => s.products)
  const [blogs, setBlogs]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [viewMode, setViewMode]   = useState('grid')
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]           = useState(1)
  const [total, setTotal]         = useState(0)
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tagInput, setTagInput]   = useState('')
  const coverRef = useRef()
  const videoRef = useRef()
  const limit = 12

  const load = async (p=1) => {
    setLoading(true)
    try {
      const params = { page: p, limit }
      if (catFilter)    params.category_id = catFilter
      if (statusFilter) params.status      = statusFilter
      if (search)       params.search      = search
      const res = await api.get('/blogs', { params })
      setBlogs(res.data.data)
      setTotal(res.data.pagination?.total || 0)
    } catch { toast.error('Failed to load') }
    setLoading(false)
  }

  useEffect(() => { load(page) }, [page, catFilter, statusFilter])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModal(true) }

  const handleCoverUpload = async file => {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('files', file)
    fd.append('folder', 'marketpro/blog')
    try {
      const res = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => ({ ...f, cover_image: res.data.data[0]?.url || '' }))
      toast.success('Cover image uploaded!')
    } catch { toast.error('Image upload failed') }
    setUploading(false)
  }

  const handleVideoUpload = async file => {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('files', file)
    fd.append('folder', 'marketpro/blog/videos')
    try {
      const res = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => ({ ...f, video_url: res.data.data[0]?.url || '' }))
      toast.success('Video uploaded!')
    } catch { toast.error('Video upload failed') }
    setUploading(false)
  }
  const openEdit = (b) => {
    setEditing(b)
    setForm({ ...EMPTY_FORM, ...b, tags: b.tags || [], category_id: b.category_id || '' })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    const payload = { ...form, slug: form.slug || slugify(form.title) }
    try {
      if (editing) {
        await api.put(`/blogs/${editing.id}`, payload)
        toast.success('Blog updated!')
      } else {
        await api.post('/blogs', payload)
        toast.success('Blog created!')
      }
      setModal(false)
      load(page)
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed') }
    setSaving(false)
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return
    try { await api.delete(`/blogs/${id}`); toast.success('Deleted'); load(page) }
    catch { toast.error('Delete failed') }
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) setForm(f => ({...f, tags:[...f.tags,t]}))
    setTagInput('')
  }

  const STATUS_BADGE = {
    published: 'bg-green-100 text-green-700',
    draft:     'bg-yellow-100 text-yellow-700',
  }

  const inputCls = 'input text-sm py-2.5'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-500" /> Blog Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} posts total</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2.5">
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9 text-sm py-2.5 w-full" placeholder="Search posts..."
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)} />
        </div>

        {/* Category filter */}
        <select className="input text-sm py-2.5 w-44" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Status filter */}
        <select className="input text-sm py-2.5 w-36" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg ml-auto">
          <button onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode==='grid' ? 'bg-white shadow-sm text-primary-500' : 'text-gray-400'}`}>
            <Grid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode==='list' ? 'bg-white shadow-sm text-primary-500' : 'text-gray-400'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Blog posts */}
      {loading ? (
        <div className={`grid gap-4 ${viewMode==='grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {Array(6).fill(0).map((_,i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : blogs.length === 0 ? (
        <div className="card p-16 text-center">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">No blog posts yet</p>
          <button onClick={openCreate} className="btn-primary text-sm mt-4">Write First Post</button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {blogs.map(b => (
            <div key={b.id} className="card overflow-hidden group">
              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                {b.cover_image
                  ? <img src={b.cover_image} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-10 h-10 text-gray-200" /></div>
                }
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_BADGE[b.status] || 'bg-gray-100 text-gray-600'}`}>
                    {b.status}
                  </span>
                  {b.is_featured && <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-semibold">Featured</span>}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(b)} className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow">
                    <Edit className="w-3.5 h-3.5 text-gray-700" />
                  </button>
                  <button onClick={() => handleDelete(b.id, b.title)} className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow">
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                {b.category && (
                  <span className="text-xs text-primary-500 font-semibold uppercase tracking-wide">{b.category.name}</span>
                )}
                <h3 className="font-semibold text-gray-800 mt-1 line-clamp-2 text-sm">{b.title}</h3>
                {b.excerpt && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{b.excerpt}</p>}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Eye className="w-3 h-3" /> {b.view_count || 0}
                  </div>
                  <p className="text-xs text-gray-400">
                    {b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : ''}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Title','Category','Status','Views','Date','Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {blogs.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {b.cover_image
                        ? <img src={b.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-gray-300" /></div>
                      }
                      <div>
                        <p className="font-semibold text-gray-800 line-clamp-1 max-w-[250px]">{b.title}</p>
                        {b.is_featured && <span className="text-xs text-primary-500 font-medium">★ Featured</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{b.category?.name || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_BADGE[b.status] || 'bg-gray-100 text-gray-600'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{b.view_count || 0}</td>
                  <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                    {b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(b.id, b.title)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > limit && (
            <div className="flex justify-between items-center px-5 py-3.5 border-t border-gray-100">
              <p className="text-xs text-gray-500">{Math.min((page-1)*limit+1,total)}–{Math.min(page*limit,total)} of {total}</p>
              <div className="flex gap-1.5">
                <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-ghost text-xs py-1 px-3 disabled:opacity-40">Prev</button>
                <button disabled={page*limit>=total} onClick={()=>setPage(p=>p+1)} className="btn-ghost text-xs py-1 px-3 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination for grid */}
      {viewMode === 'grid' && total > limit && (
        <div className="flex justify-center gap-2">
          <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn-ghost text-sm py-2 px-4 disabled:opacity-40">← Prev</button>
          <span className="py-2 px-4 text-sm text-gray-500">Page {page} of {Math.ceil(total/limit)}</span>
          <button disabled={page*limit>=total} onClick={()=>setPage(p=>p+1)} className="btn-ghost text-sm py-2 px-4 disabled:opacity-40">Next →</button>
        </div>
      )}

      {/* Blog editor modal */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setModal(false)} />
          <div className="fixed inset-x-4 top-4 bottom-4 bg-white rounded-2xl z-50 max-w-4xl mx-auto shadow-2xl flex flex-col animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-display font-bold text-xl">{editing ? 'Edit Post' : 'New Blog Post'}</h3>
              <button onClick={() => setModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <form onSubmit={handleSave} id="blog-form" className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Title *</label>
                    <input className={inputCls} required placeholder="Blog post title"
                      value={form.title}
                      onChange={e => setForm(f => ({...f, title: e.target.value, slug: f.slug || slugify(e.target.value)}))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Status</label>
                    <select className={inputCls} value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Slug (URL)</label>
                    <input className={inputCls} placeholder="auto-generated-from-title"
                      value={form.slug} onChange={e => setForm(f => ({...f, slug: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Category</label>
                    <select className={inputCls} value={form.category_id} onChange={e => setForm(f => ({...f, category_id: e.target.value}))}>
                      <option value="">No Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Cover Image</label>
                  <div className="flex gap-2">
                    <input className={`${inputCls} flex-1`} placeholder="https://... or upload →"
                      value={form.cover_image} onChange={e => setForm(f => ({...f, cover_image: e.target.value}))} />
                    <button type="button" onClick={() => coverRef.current?.click()}
                      className="btn-secondary text-sm py-2.5 px-3 flex-shrink-0 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      {uploading ? '...' : 'Upload'}
                    </button>
                    <input ref={coverRef} type="file" accept="image/*" className="hidden"
                      onChange={e => handleCoverUpload(e.target.files[0])} />
                  </div>
                  {form.cover_image && (
                    <img src={form.cover_image} alt="" className="mt-2 h-32 rounded-xl object-cover border border-gray-200" />
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Excerpt</label>
                  <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Short summary shown in listing"
                    value={form.excerpt} onChange={e => setForm(f => ({...f, excerpt: e.target.value}))} />
                </div>

                {/* Video section */}
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-primary-500" /> Video (optional)
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">YouTube URL</label>
                      <input className={inputCls} placeholder="https://youtube.com/watch?v=..."
                        value={form.youtube_url || ''} onChange={e => setForm(f => ({...f, youtube_url: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1.5">Upload Video File</label>
                      <div onClick={() => videoRef.current?.click()}
                        className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-all">
                        {uploading
                          ? <p className="text-xs text-primary-500 animate-pulse">Uploading...</p>
                          : <><Upload className="w-4 h-4 text-gray-300 mx-auto mb-1" /><p className="text-xs text-gray-400">MP4, WebM, MOV</p></>
                        }
                        <input ref={videoRef} type="file" accept="video/*" className="hidden"
                          onChange={e => handleVideoUpload(e.target.files[0])} />
                      </div>
                    </div>
                  </div>
                  {form.youtube_url && (
                    <div className="rounded-xl overflow-hidden aspect-video bg-black">
                      <iframe src={form.youtube_url.replace('watch?v=','embed/').replace('youtu.be/','www.youtube.com/embed/')}
                        allow="autoplay" allowFullScreen className="w-full h-full" />
                    </div>
                  )}
                  {form.video_url && !form.youtube_url && (
                    <video src={form.video_url} controls className="w-full rounded-xl max-h-48" />
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Content</label>
                  <textarea rows={10} className={`${inputCls} resize-none font-mono text-xs`}
                    placeholder="Write your blog content here (HTML or Markdown supported)..."
                    value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} />
                </div>

                {/* Tags */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Tags</label>
                  <div className="flex gap-2">
                    <input className={`${inputCls} flex-1`} placeholder="Add tag and press Enter"
                      value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                    <button type="button" onClick={addTag} className="btn-primary py-2.5 px-4 text-sm">Add</button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.tags.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
                          {t}
                          <button type="button" onClick={() => setForm(f => ({...f, tags: f.tags.filter(x=>x!==t)}))}><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="accent-primary-500 w-4 h-4" checked={form.is_featured}
                    onChange={e => setForm(f => ({...f, is_featured: e.target.checked}))} />
                  <span className="text-sm text-gray-700 font-medium">Featured post (shown prominently)</span>
                </label>
              </form>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button form="blog-form" type="submit" disabled={saving} className="btn-primary flex-1">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : editing ? 'Update Post' : 'Publish Post'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
