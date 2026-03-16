import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Tags, ChevronDown, ChevronRight } from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

const EMPTY = { name:'', description:'', is_active:true, parent_id:'' }

export default function AdminCategories() {
  const [cats, setCats]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [expanded, setExpanded] = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/categories/all')
      setCats(res.data.data)
    } catch { toast.error('Failed to load') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openCreate = (parentId = '') => {
    setEditing(null)
    setForm({ ...EMPTY, parent_id: parentId })
    setModal(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    setForm({ name: cat.name, description: cat.description||'', is_active: cat.is_active, parent_id: cat.parent_id||'' })
    setModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name required'); return }
    setSaving(true)
    try {
      const payload = { ...form, parent_id: form.parent_id || null }
      if (editing) {
        await api.put(`/categories/${editing.id}`, payload)
        toast.success('Category updated!')
      } else {
        await api.post('/categories', payload)
        toast.success('Category created!')
      }
      setModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed') }
    setSaving(false)
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await api.delete(`/categories/${id}`)
      toast.success('Deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  // Separate top-level and sub-categories
  const topLevel = cats.filter(c => !c.parent_id)
  const subOf = (parentId) => cats.filter(c => c.parent_id === parentId)

  const inputCls = 'input text-sm py-2.5'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm">{topLevel.length} top-level, {cats.length - topLevel.length} subcategories</p>
        </div>
        <button onClick={() => openCreate()} className="btn-primary text-sm py-2.5">
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
      ) : topLevel.length === 0 ? (
        <div className="card p-16 text-center">
          <Tags className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold mb-2">No categories yet</p>
          <button onClick={() => openCreate()} className="btn-primary text-sm mt-2">Create First Category</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {topLevel.map((cat, idx) => {
            const subs = subOf(cat.id)
            const isExpanded = expanded[cat.id]
            return (
              <div key={cat.id} className={idx > 0 ? 'border-t border-gray-100' : ''}>
                {/* Top-level row */}
                <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <button
                    onClick={() => setExpanded(e => ({...e, [cat.id]: !e[cat.id]}))}
                    className="p-1 rounded hover:bg-gray-200 transition-colors flex-shrink-0"
                  >
                    {subs.length > 0
                      ? (isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)
                      : <span className="w-4 h-4 block" />}
                  </button>
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Tags className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{cat.name}</p>
                    {cat.description && <p className="text-xs text-gray-400 truncate">{cat.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {subs.length > 0 && (
                      <span className="badge-gray text-xs">{subs.length} sub</span>
                    )}
                    <span className={cat.is_active ? 'badge-success' : 'badge-gray'}>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => openCreate(cat.id)}
                      className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Add subcategory">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(cat)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {isExpanded && subs.map(sub => (
                  <div key={sub.id} className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-t border-gray-100 pl-16">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Tags className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700">{sub.name}</p>
                      {sub.description && <p className="text-xs text-gray-400 truncate">{sub.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={sub.is_active ? 'badge-success' : 'badge-gray'}>
                        {sub.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button onClick={() => openEdit(sub)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(sub.id, sub.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setModal(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-50 max-w-md mx-auto shadow-2xl animate-scale-in">
            <h3 className="font-display font-bold text-xl mb-5">
              {editing ? 'Edit Category' : form.parent_id ? 'Add Subcategory' : 'Add Category'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Name *</label>
                <input className={inputCls} required placeholder="Category name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Description</label>
                <input className={inputCls} placeholder="Optional description" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
              </div>
              {!form.parent_id && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Parent Category (for subcategory)</label>
                  <select className={inputCls} value={form.parent_id} onChange={e => setForm(f=>({...f,parent_id:e.target.value}))}>
                    <option value="">None (top-level)</option>
                    {topLevel.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
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
