import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Award, Globe } from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

const EMPTY = { name:'', description:'', website:'', logo:'', is_active:true }

export default function AdminBrands() {
  const [brands, setBrands]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/brands')
      setBrands(res.data.data)
    } catch { toast.error('Failed to load') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openEdit = (brand) => {
    setEditing(brand)
    setForm({ name:brand.name, description:brand.description||'', website:brand.website||'', logo:brand.logo||'', is_active:brand.is_active })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/brands/${editing.id}`, form)
        toast.success('Brand updated!')
      } else {
        await api.post('/brands', form)
        toast.success('Brand created!')
      }
      setModal(false)
      setEditing(null)
      setForm(EMPTY)
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed') }
    setSaving(false)
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete brand "${name}"?`)) return
    try {
      await api.delete(`/brands/${id}`)
      toast.success('Brand deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  const inputCls = 'input text-sm py-2.5'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Brands</h1>
          <p className="text-gray-500 text-sm">{brands.length} brands</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setModal(true) }} className="btn-primary text-sm py-2.5">
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : brands.length === 0 ? (
        <div className="card p-16 text-center">
          <Award className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold">No brands yet</p>
          <button onClick={() => { setEditing(null); setForm(EMPTY); setModal(true) }} className="btn-primary text-sm mt-4">Add First Brand</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map(brand => (
            <div key={brand.id} className="card p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                  {brand.logo
                    ? <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-1" />
                    : <Award className="w-6 h-6 text-gray-400" />}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(brand)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(brand.id, brand.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800">{brand.name}</h3>
              {brand.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{brand.description}</p>}
              {brand.website && (
                <a href={brand.website} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 mt-2 font-medium">
                  <Globe className="w-3 h-3" /> Website
                </a>
              )}
              <div className="mt-3">
                <span className={brand.is_active ? 'badge-success' : 'badge-gray'}>
                  {brand.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setModal(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-50 max-w-md mx-auto shadow-2xl animate-scale-in">
            <h3 className="font-display font-bold text-xl mb-5">{editing ? 'Edit Brand' : 'Add Brand'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Brand Name *</label>
                <input className={inputCls} required placeholder="e.g. Nike" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Description</label>
                <input className={inputCls} placeholder="Short description" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Logo URL</label>
                <input className={inputCls} placeholder="https://..." value={form.logo} onChange={e => setForm(f=>({...f,logo:e.target.value}))} />
                {form.logo && <img src={form.logo} alt="" className="w-16 h-16 rounded-lg object-contain bg-gray-100 p-1 mt-2" />}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Website</label>
                <input className={inputCls} placeholder="https://brand.com" value={form.website} onChange={e => setForm(f=>({...f,website:e.target.value}))} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="accent-primary-500 w-4 h-4" checked={form.is_active} onChange={e => setForm(f=>({...f,is_active:e.target.checked}))} />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
