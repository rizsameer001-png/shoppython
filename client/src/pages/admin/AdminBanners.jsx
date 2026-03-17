import { useEffect, useState, useRef } from 'react'
import { Plus, Edit, Trash2, X, Save, Megaphone, Image as ImageIcon, Monitor, Layout, Sparkles, ShoppingBag, Bell, Upload } from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

const BANNER_TYPES = [
  { value:'hero',       label:'Hero Banner',    icon: Monitor,     desc:'Full-width homepage banner',         color:'bg-blue-50 text-blue-700 border-blue-200' },
  { value:'side',       label:'Side Banner',    icon: Layout,      desc:'Sidebar advertisement',              color:'bg-purple-50 text-purple-700 border-purple-200' },
  { value:'popup',      label:'Popup',          icon: Bell,        desc:'Modal overlay with delay',           color:'bg-orange-50 text-orange-700 border-orange-200' },
  { value:'festival',   label:'Festival',       icon: Sparkles,    desc:'Holiday / seasonal promotion',       color:'bg-pink-50 text-pink-700 border-pink-200' },
  { value:'product_ad', label:'Product Ad',     icon: ShoppingBag, desc:'Sponsored product highlight',        color:'bg-green-50 text-green-700 border-green-200' },
]

const POSITIONS = ['home','products','sidebar','category','checkout','popup']

const EMPTY = {
  title:'', subtitle:'', type:'hero', image:'', mobile_image:'', video_url:'',
  link_url:'', link_text:'Shop Now', position:'home', product_ids:[],
  category_id:'', bg_color:'', text_color:'', start_date:'', end_date:'',
  sort_order:0, is_active:true, popup_delay_ms:3000, popup_once_per_session:true,
  festival_name:'', badge_text:'',
}

export default function AdminBanners() {
  const [banners, setBanners]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [typeFilter, setType]   = useState('')
  const [modal, setModal]       = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const imgRef       = useRef()
  const mobileImgRef = useRef()

  const handleImgUpload = async (file, field) => {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('files', file)
    fd.append('folder', 'marketpro/banners')
    try {
      const res = await api.post('/upload/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => ({ ...f, [field]: res.data.data[0]?.url || '' }))
      toast.success('Image uploaded!')
    } catch { toast.error('Upload failed') }
    setUploading(false)
  }

  const load = async () => {
    setLoading(true)
    try {
      const params = { active_only: false }
      if (typeFilter) params.type = typeFilter
      const res = await api.get('/banners/admin/all', { params })
      setBanners(typeFilter ? res.data.data.filter(b => b.type === typeFilter) : res.data.data)
    } catch { toast.error('Failed to load') }
    setLoading(false)
  }

  useEffect(() => { load() }, [typeFilter])

  const openCreate = (type = 'hero') => {
    setEditing(null)
    setForm({ ...EMPTY, type })
    setModal(true)
  }

  const openEdit = (b) => {
    setEditing(b)
    setForm({ ...EMPTY, ...b })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/banners/${editing.id}`, form)
        toast.success('Banner updated!')
      } else {
        await api.post('/banners', form)
        toast.success('Banner created!')
      }
      setModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed') }
    setSaving(false)
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return
    try { await api.delete(`/banners/${id}`); toast.success('Deleted'); load() }
    catch { toast.error('Delete failed') }
  }

  const toggleActive = async (b) => {
    try {
      await api.put(`/banners/${b.id}`, { ...b, is_active: !b.is_active })
      toast.success(b.is_active ? 'Banner deactivated' : 'Banner activated')
      load()
    } catch { toast.error('Update failed') }
  }

  const inputCls = 'input text-sm py-2.5'
  const set = k => e => setForm(f => ({...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value}))

  const byType = (type) => banners.filter(b => b.type === type)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary-500" /> Banners & Ads
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{banners.length} total banners and ads</p>
        </div>
      </div>

      {/* Type cards — quick create + count */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {BANNER_TYPES.map(({ value, label, icon: Icon, desc, color }) => (
          <div key={value} className={`card p-4 border ${color} cursor-pointer hover:shadow-card-hover transition-shadow`}
            onClick={() => setType(typeFilter === value ? '' : value)}>
            <div className="flex items-start justify-between mb-2">
              <Icon className="w-5 h-5" />
              <span className={`text-lg font-display font-bold ${typeFilter === value ? 'text-primary-600' : ''}`}>
                {byType(value).length}
              </span>
            </div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs opacity-70 mt-0.5 line-clamp-2">{desc}</p>
            <button onClick={e => { e.stopPropagation(); openCreate(value) }}
              className="mt-3 w-full text-xs font-semibold py-1.5 rounded-lg bg-white/60 hover:bg-white transition-colors flex items-center justify-center gap-1">
              <Plus className="w-3 h-3" /> Create
            </button>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setType('')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!typeFilter ? 'bg-primary-500 text-white shadow-primary' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          All Banners
        </button>
        {BANNER_TYPES.map(t => (
          <button key={t.value} onClick={() => setType(t.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${typeFilter===t.value ? 'bg-primary-500 text-white shadow-primary' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t.label} {byType(t.value).length > 0 && `(${byType(t.value).length})`}
          </button>
        ))}
      </div>

      {/* Banners table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : banners.length === 0 ? (
        <div className="card p-16 text-center">
          <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">No banners yet</p>
          <button onClick={() => openCreate()} className="btn-primary text-sm mt-4">Create First Banner</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Preview','Title','Type','Position','Active','Period','Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {banners.map(b => {
                const typeInfo = BANNER_TYPES.find(t => t.value === b.type)
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      {b.image
                        ? <img src={b.image} alt="" className="w-16 h-10 rounded-lg object-cover border border-gray-200" />
                        : <div className="w-16 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-300" /></div>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800 line-clamp-1 max-w-[180px]">{b.title}</p>
                      {b.subtitle && <p className="text-xs text-gray-400 line-clamp-1">{b.subtitle}</p>}
                      {b.badge_text && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">{b.badge_text}</span>}
                    </td>
                    <td className="px-5 py-4">
                      {typeInfo && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 capitalize">{b.position}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleActive(b)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${b.is_active ? 'bg-primary-500' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${b.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {b.start_date || b.end_date
                        ? <>{b.start_date || '∞'} → {b.end_date || '∞'}</>
                        : 'Always'
                      }
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(b.id, b.title)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setModal(false)} />
          <div className="fixed inset-x-4 top-4 bottom-4 bg-white rounded-2xl z-50 max-w-2xl mx-auto shadow-2xl flex flex-col animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-display font-bold text-xl">
                {editing ? 'Edit Banner' : `Create ${BANNER_TYPES.find(t=>t.value===form.type)?.label}`}
              </h3>
              <button onClick={() => setModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <form onSubmit={handleSave} id="banner-form" className="space-y-4">
                {/* Type selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">Banner Type</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {BANNER_TYPES.map(t => (
                      <button type="button" key={t.value} onClick={() => setForm(f => ({...f, type: t.value}))}
                        className={`p-2 rounded-xl border-2 text-xs font-semibold transition-all text-center ${form.type === t.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Title *</label>
                    <input className={inputCls} required placeholder="Banner headline" value={form.title} onChange={set('title')} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Subtitle</label>
                    <input className={inputCls} placeholder="Supporting text" value={form.subtitle} onChange={set('subtitle')} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Banner Image</label>
                  <div className="flex gap-2">
                    <input className={`${inputCls} flex-1`} placeholder="https://... or upload →"
                      value={form.image} onChange={set('image')} />
                    <button type="button" onClick={() => imgRef.current?.click()}
                      className="btn-secondary text-sm py-2.5 px-3 flex-shrink-0 flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      {uploading ? '...' : 'Upload'}
                    </button>
                    <input ref={imgRef} type="file" accept="image/*" className="hidden"
                      onChange={e => handleImgUpload(e.target.files[0], 'image')} />
                  </div>
                  {form.image && <img src={form.image} alt="" className="mt-2 h-24 rounded-xl object-cover border border-gray-200" />}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Mobile Image (optional)</label>
                  <div className="flex gap-2">
                    <input className={`${inputCls} flex-1`} placeholder="Different image for mobile"
                      value={form.mobile_image} onChange={set('mobile_image')} />
                    <button type="button" onClick={() => mobileImgRef.current?.click()}
                      className="btn-secondary text-sm py-2.5 px-3 flex-shrink-0 flex items-center gap-1.5">
                      <Upload className="w-4 h-4" /> Upload
                    </button>
                    <input ref={mobileImgRef} type="file" accept="image/*" className="hidden"
                      onChange={e => handleImgUpload(e.target.files[0], 'mobile_image')} />
                  </div>
                  {form.mobile_image && <img src={form.mobile_image} alt="" className="mt-2 h-16 rounded-xl object-cover border border-gray-200" />}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Link URL</label>
                    <input className={inputCls} placeholder="/products?on_sale=true" value={form.link_url} onChange={set('link_url')} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Button Text</label>
                    <input className={inputCls} placeholder="Shop Now" value={form.link_text} onChange={set('link_text')} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Position</label>
                    <select className={inputCls} value={form.position} onChange={set('position')}>
                      {POSITIONS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Sort Order</label>
                    <input type="number" className={inputCls} value={form.sort_order} onChange={set('sort_order')} />
                  </div>
                </div>

                {/* Colors */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Background Color</label>
                    <div className="flex gap-2">
                      <input type="color" className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200"
                        value={form.bg_color || '#ffffff'} onChange={e => setForm(f => ({...f, bg_color: e.target.value}))} />
                      <input className={`${inputCls} flex-1`} placeholder="#ffffff" value={form.bg_color} onChange={set('bg_color')} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Text Color</label>
                    <div className="flex gap-2">
                      <input type="color" className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200"
                        value={form.text_color || '#000000'} onChange={e => setForm(f => ({...f, text_color: e.target.value}))} />
                      <input className={`${inputCls} flex-1`} placeholder="#000000" value={form.text_color} onChange={set('text_color')} />
                    </div>
                  </div>
                </div>

                {/* Date range */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Start Date (optional)</label>
                    <input type="date" className={inputCls} value={form.start_date} onChange={set('start_date')} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">End Date (optional)</label>
                    <input type="date" className={inputCls} value={form.end_date} onChange={set('end_date')} />
                  </div>
                </div>

                {/* Popup-specific */}
                {form.type === 'popup' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">Popup Settings</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Delay (milliseconds)</label>
                        <input type="number" className={inputCls} value={form.popup_delay_ms} onChange={set('popup_delay_ms')} />
                        <p className="text-xs text-gray-400 mt-1">{form.popup_delay_ms / 1000}s after page load</p>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer mt-4">
                        <input type="checkbox" className="accent-primary-500 w-4 h-4"
                          checked={form.popup_once_per_session} onChange={e => setForm(f => ({...f, popup_once_per_session: e.target.checked}))} />
                        <span className="text-sm text-gray-700">Show once per session</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Festival-specific */}
                {form.type === 'festival' && (
                  <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-pink-700 uppercase tracking-wide">Festival Settings</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Festival Name</label>
                        <input className={inputCls} placeholder="Diwali Sale, Christmas..." value={form.festival_name} onChange={set('festival_name')} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1.5">Badge Text</label>
                        <input className={inputCls} placeholder="🎉 Upto 70% Off" value={form.badge_text} onChange={set('badge_text')} />
                      </div>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="accent-primary-500 w-4 h-4" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} />
                  <span className="text-sm text-gray-700 font-medium">Active (visible on site)</span>
                </label>
              </form>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button form="banner-form" type="submit" disabled={saving} className="btn-primary flex-1">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : editing ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
