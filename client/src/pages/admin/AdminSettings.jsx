import { useEffect, useState, useRef } from 'react'
import { Save, Upload, Settings, Globe, Phone, Mail, MapPin, Instagram, Twitter, Facebook, Youtube, Image as ImageIcon, X } from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

const EMPTY = {
  store_name: '', store_tagline: '', store_description: '',
  logo_url: '', logo_text: '', favicon_url: '',
  contact_email: '', contact_phone: '', contact_address: '',
  social_instagram: '', social_twitter: '', social_facebook: '', social_youtube: '',
  footer_description: '', currency: 'INR', currency_symbol: '₹',
  hero_stats: [
    { label: 'Products', value: '50K+' },
    { label: 'Customers', value: '200K+' },
    { label: 'Rating', value: '4.8★' },
  ],
}

export default function AdminSettings() {
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loaded, setLoaded]     = useState(false)
  const logoRef                 = useRef()

  // Load saved settings — merge carefully so logo_url is never overwritten by ""
  useEffect(() => {
    api.get('/settings').then(r => {
      const data = r.data.data || {}
      setForm(prev => ({
        ...EMPTY,
        ...data,
        // Always trust the server value for logo_url (never let EMPTY's "" overwrite it)
        logo_url: data.logo_url || '',
        hero_stats: data.hero_stats?.length > 0 ? data.hero_stats : EMPTY.hero_stats,
      }))
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/settings', form)
      toast.success('Settings saved!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed')
    }
    setSaving(false)
  }

  const uploadLogo = async file => {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await api.post('/settings/upload-logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = r.data.data.url
      setForm(f => ({ ...f, logo_url: url }))
      toast.success('Logo uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    }
    setUploading(false)
    // Reset file input so same file can be re-uploaded
    if (logoRef.current) logoRef.current.value = ''
  }

  const removeLogo = () => setForm(f => ({ ...f, logo_url: '' }))

  const setStatVal = (i, k, v) => {
    const stats = [...(form.hero_stats || [])]
    stats[i] = { ...stats[i], [k]: v }
    setForm(f => ({ ...f, hero_stats: stats }))
  }

  const inputCls = 'input text-sm py-2.5'
  const lbl = 'text-xs font-semibold text-gray-600 block mb-1.5'

  if (!loaded) return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-500" /> Store Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Logo, name, contact, social links — shown in header, footer and home page
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* ── Logo & Brand ── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary-500" /> Logo & Brand
          </h2>

          {/* Logo preview + upload */}
          <div className="flex gap-4 items-start">
            {/* Preview box */}
            <div className="w-24 h-24 rounded-xl border-2 border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
              {form.logo_url ? (
                <>
                  <img
                    src={form.logo_url}
                    alt="logo preview"
                    className="max-w-full max-h-full object-contain p-2"
                    onError={e => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div style={{ display: 'none' }} className="absolute inset-0 items-center justify-center text-xs text-red-400 text-center p-1">
                    Image failed to load
                  </div>
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 z-10"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                  <p className="text-xs text-gray-400">No logo</p>
                </div>
              )}
            </div>

            {/* URL + upload */}
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  placeholder="Paste logo URL (https://...)"
                  value={form.logo_url}
                  onChange={set('logo_url')}
                />
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary text-sm py-2.5 px-3 flex-shrink-0 flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => uploadLogo(e.target.files[0])}
                />
              </div>
              <p className="text-xs text-gray-400">
                PNG with transparent background recommended · 200×60 px or larger
              </p>
              {form.logo_url && (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                  ✓ Logo URL set — save to apply across the site
                </p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Store Name *</label>
              <input className={inputCls} value={form.store_name} onChange={set('store_name')} placeholder="MarketPro" />
            </div>
            <div>
              <label className={lbl}>Logo Text (shown beside logo if no image)</label>
              <input className={inputCls} value={form.logo_text} onChange={set('logo_text')} placeholder="MarketPro" />
            </div>
          </div>

          <div>
            <label className={lbl}>Tagline</label>
            <input className={inputCls} value={form.store_tagline} onChange={set('store_tagline')} placeholder="Premium products, delivered fast" />
          </div>

          <div>
            <label className={lbl}>Footer Description</label>
            <textarea
              rows={3}
              className={`${inputCls} resize-none`}
              value={form.footer_description}
              onChange={set('footer_description')}
              placeholder="A short paragraph about your store shown in the footer…"
            />
          </div>
        </div>

        {/* ── Hero stats ── */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary-500" /> Homepage Hero Stats
          </h2>
          <p className="text-xs text-gray-400">3 numbers shown in the hero banner (e.g. 50K+ Products)</p>
          <div className="space-y-2">
            {(form.hero_stats || []).map((s, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <input
                  className={inputCls}
                  placeholder="Value (50K+)"
                  value={s.value || ''}
                  onChange={e => setStatVal(i, 'value', e.target.value)}
                />
                <input
                  className={inputCls}
                  placeholder="Label (Products)"
                  value={s.label || ''}
                  onChange={e => setStatVal(i, 'label', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Contact ── */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary-500" /> Contact Info
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}><Mail className="w-3.5 h-3.5 inline mr-1" />Email</label>
              <input type="email" className={inputCls} value={form.contact_email} onChange={set('contact_email')} placeholder="hello@store.com" />
            </div>
            <div>
              <label className={lbl}><Phone className="w-3.5 h-3.5 inline mr-1" />Phone</label>
              <input className={inputCls} value={form.contact_phone} onChange={set('contact_phone')} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className={lbl}><MapPin className="w-3.5 h-3.5 inline mr-1" />Address</label>
            <input className={inputCls} value={form.contact_address} onChange={set('contact_address')} placeholder="City, Country" />
          </div>
        </div>

        {/* ── Social ── */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary-500" /> Social Links
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={lbl}><Instagram className="w-3.5 h-3.5 inline mr-1" />Instagram</label>
              <input className={inputCls} value={form.social_instagram} onChange={set('social_instagram')} placeholder="https://instagram.com/yourstore" />
            </div>
            <div>
              <label className={lbl}><Twitter className="w-3.5 h-3.5 inline mr-1" />X / Twitter</label>
              <input className={inputCls} value={form.social_twitter} onChange={set('social_twitter')} placeholder="https://twitter.com/yourstore" />
            </div>
            <div>
              <label className={lbl}><Facebook className="w-3.5 h-3.5 inline mr-1" />Facebook</label>
              <input className={inputCls} value={form.social_facebook} onChange={set('social_facebook')} placeholder="https://facebook.com/yourstore" />
            </div>
            <div>
              <label className={lbl}><Youtube className="w-3.5 h-3.5 inline mr-1" />YouTube</label>
              <input className={inputCls} value={form.social_youtube} onChange={set('social_youtube')} placeholder="https://youtube.com/@yourstore" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-3">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save All Settings'}
        </button>
      </form>
    </div>
  )
}
