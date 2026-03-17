import { useEffect, useState, useRef } from 'react'
import { Plus, Edit, Trash2, X, Save, FileText, Upload, Download, Globe, Eye, EyeOff } from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

const PAGE_TYPES = [
  { value:'page',    label:'General Page' },
  { value:'landing', label:'Landing Page' },
  { value:'policy',  label:'Policy (T&C, Privacy)' },
  { value:'faq',     label:'FAQ Page' },
]

const EMPTY = {
  title:'', slug:'', content:'', excerpt:'', cover_image:'',
  page_type:'page', status:'draft', is_featured:false,
  show_on_home:false, downloadable_files:[], allow_download:false,
  meta_title:'', meta_description:'', sort_order:0,
}

function slugify(t) {
  return t.toLowerCase().trim().replace(/[^\w\s-]/g,'').replace(/[\s_-]+/g,'-')
}

export default function AdminCMS() {
  const [pages, setPages]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef                 = useRef()
  const coverRef                = useRef()

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/cms'); setPages(r.data.data) }
    catch { toast.error('Failed to load') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = p => { setEditing(p); setForm({ ...EMPTY, ...p }); setModal(true) }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title required'); return }
    setSaving(true)
    const payload = { ...form, slug: form.slug || slugify(form.title) }
    try {
      if (editing) { await api.put(`/cms/${editing.id}`, payload); toast.success('Page updated!') }
      else { await api.post('/cms', payload); toast.success('Page created!') }
      setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed') }
    setSaving(false)
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return
    try { await api.delete(`/cms/${id}`); toast.success('Deleted'); load() }
    catch { toast.error('Delete failed') }
  }

  // Upload cover image
  const handleCoverUpload = async file => {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('files', file)
    fd.append('folder', 'marketpro/cms')
    try {
      const res = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => ({ ...f, cover_image: res.data.data[0]?.url || '' }))
      toast.success('Cover image uploaded!')
    } catch { toast.error('Upload failed') }
    setUploading(false)
  }

  // Upload downloadable file (only works on existing pages)
  const handleFileUpload = async file => {
    if (!file || !editing?.id) { toast.error('Save the page first, then upload files'); return }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post(`/cms/${editing.id}/upload-file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => ({ ...f, downloadable_files: [...(f.downloadable_files || []), res.data.data] }))
      toast.success('File uploaded!')
    } catch { toast.error('File upload failed') }
    setUploading(false)
  }

  const removeFile = idx => setForm(f => ({ ...f, downloadable_files: f.downloadable_files.filter((_,i) => i !== idx) }))

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const inputCls = 'input text-sm py-2.5'
  const labelCls = 'text-xs font-semibold text-gray-600 block mb-1.5'

  const STATUS_BADGE = { published:'bg-green-100 text-green-700', draft:'bg-yellow-100 text-yellow-700' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-500" /> CMS Pages
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{pages.length} pages — create custom pages, policies, landing pages with file downloads</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-sm py-2.5">
          <Plus className="w-4 h-4" /> New Page
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : pages.length === 0 ? (
        <div className="card p-16 text-center">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">No CMS pages yet</p>
          <p className="text-gray-400 text-sm mt-1">Create About Us, Privacy Policy, FAQs, landing pages etc.</p>
          <button onClick={openCreate} className="btn-primary text-sm mt-4">Create First Page</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Title','Type','Status','On Home','Downloads','Actions'].map(h=>(
                <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pages.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {p.cover_image
                        ? <img src={p.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-gray-300" /></div>
                      }
                      <div>
                        <p className="font-semibold text-gray-800">{p.title}</p>
                        <p className="text-xs text-gray-400 font-mono">/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 capitalize">{p.page_type}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_BADGE[p.status]||'bg-gray-100 text-gray-600'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {p.show_on_home
                      ? <Globe className="w-4 h-4 text-green-500" />
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {p.downloadable_files?.length > 0
                      ? <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" /> {p.downloadable_files.length} file{p.downloadable_files.length!==1?'s':''}</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <a href={`/pages/${p.slug}`} target="_blank" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </a>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id, p.title)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setModal(false)} />
          <div className="fixed inset-x-4 top-4 bottom-4 bg-white rounded-2xl z-50 max-w-4xl mx-auto shadow-2xl flex flex-col animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-display font-bold text-xl">{editing ? 'Edit Page' : 'Create CMS Page'}</h3>
              <button onClick={() => setModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <form onSubmit={handleSave} id="cms-form" className="space-y-5">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Page Title *</label>
                    <input className={inputCls} required placeholder="e.g. About Us"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: f.slug || slugify(e.target.value) }))} />
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select className={inputCls} value={form.status} onChange={set('status')}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>URL Slug</label>
                    <input className={inputCls} placeholder="about-us" value={form.slug} onChange={set('slug')} />
                    <p className="text-xs text-gray-400 mt-1">Accessible at: <code>/pages/{form.slug || 'slug'}</code></p>
                  </div>
                  <div>
                    <label className={labelCls}>Page Type</label>
                    <select className={inputCls} value={form.page_type} onChange={set('page_type')}>
                      {PAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Cover image */}
                <div>
                  <label className={labelCls}>Cover Image</label>
                  <div className="flex gap-3">
                    <input className={`${inputCls} flex-1`} placeholder="https://..." value={form.cover_image} onChange={set('cover_image')} />
                    <button type="button" onClick={() => coverRef.current?.click()}
                      className="btn-secondary text-sm py-2.5 flex-shrink-0">
                      <Upload className="w-4 h-4" /> Upload
                    </button>
                    <input ref={coverRef} type="file" accept="image/*" className="hidden"
                      onChange={e => handleCoverUpload(e.target.files[0])} />
                  </div>
                  {form.cover_image && <img src={form.cover_image} alt="" className="mt-2 h-32 rounded-xl object-cover border border-gray-200" />}
                </div>

                {/* Content */}
                <div>
                  <label className={labelCls}>Page Content</label>
                  <textarea rows={12} className={`${inputCls} resize-none font-mono text-xs`}
                    placeholder="Write your page content here (HTML supported)..."
                    value={form.content} onChange={set('content')} />
                </div>

                <div>
                  <label className={labelCls}>Excerpt / Short Summary</label>
                  <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Brief description for cards and previews"
                    value={form.excerpt} onChange={set('excerpt')} />
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-primary-500 w-4 h-4" checked={form.show_on_home} onChange={set('show_on_home')} />
                    <span className="text-sm font-medium text-gray-700">Show on Homepage</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-primary-500 w-4 h-4" checked={form.allow_download} onChange={set('allow_download')} />
                    <span className="text-sm font-medium text-gray-700">Allow file downloads</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="accent-primary-500 w-4 h-4" checked={form.is_featured} onChange={set('is_featured')} />
                    <span className="text-sm font-medium text-gray-700">Featured</span>
                  </label>
                </div>

                {/* File uploads */}
                {form.allow_download && (
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-blue-700 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Downloadable Files
                      </p>
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={!editing}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5
                          ${editing ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                        <Upload className="w-3 h-3" />
                        {editing ? 'Upload File' : 'Save page first to upload files'}
                      </button>
                      <input ref={fileRef} type="file" className="hidden"
                        onChange={e => handleFileUpload(e.target.files[0])} />
                    </div>

                    {uploading && <p className="text-xs text-blue-600 animate-pulse">Uploading file...</p>}

                    {(form.downloadable_files || []).length > 0 ? (
                      <div className="space-y-2">
                        {form.downloadable_files.map((f, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100">
                            <Download className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                              <p className="text-xs text-gray-400">{f.type} · {f.size ? `${Math.round(f.size/1024)}KB` : ''}</p>
                            </div>
                            <a href={f.url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline font-medium flex-shrink-0">Preview</a>
                            <button type="button" onClick={() => removeFile(i)}
                              className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200 flex-shrink-0">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-blue-600 opacity-70">No files yet. Upload PDFs, images, documents...</p>
                    )}
                  </div>
                )}

                {/* SEO */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Meta Title</label>
                    <input className={inputCls} placeholder="SEO title" value={form.meta_title} onChange={set('meta_title')} />
                  </div>
                  <div>
                    <label className={labelCls}>Meta Description</label>
                    <input className={inputCls} placeholder="SEO description" value={form.meta_description} onChange={set('meta_description')} />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Sort Order</label>
                  <input type="number" className={`${inputCls} w-24`} value={form.sort_order} onChange={set('sort_order')} />
                </div>
              </form>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button form="cms-form" type="submit" disabled={saving} className="btn-primary flex-1">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : editing ? 'Update Page' : 'Create Page'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
