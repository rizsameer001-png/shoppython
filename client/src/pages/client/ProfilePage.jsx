import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateProfile } from '@/store/slices/authSlice'
import { User, Mail, Phone, Camera, Save } from 'lucide-react'

export default function ProfilePage() {
  const dispatch = useDispatch()
  const { user, loading } = useSelector(s => s.auth)
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [tab, setTab] = useState('profile')

  const handleSave = () => dispatch(updateProfile(form))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="section-title mb-8">My Profile</h1>

      <div className="grid sm:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="card p-5 h-fit text-center">
          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover" />
                : <span className="text-primary-600 font-display font-bold text-3xl">{user?.name?.[0]?.toUpperCase()}</span>
              }
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 rounded-full flex items-center justify-center text-white hover:bg-primary-600 transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="font-display font-bold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <span className="badge-primary mt-2 capitalize">{user?.role}</span>

          <div className="mt-5 space-y-1 text-left">
            {['profile','orders','addresses'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors
                  ${tab === t ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="sm:col-span-2">
          {tab === 'profile' && (
            <div className="card p-6 space-y-5 animate-fade-in">
              <h2 className="font-display font-bold text-xl">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input className="input pl-9" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input className="input pl-9 bg-gray-50" value={user?.email} disabled />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input className="input pl-9" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
                  </div>
                </div>
              </div>
              <button onClick={handleSave} disabled={loading} className="btn-primary">
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {tab === 'orders' && (
            <div className="card p-6 text-center py-12 animate-fade-in">
              <p className="text-gray-500 mb-4">View your order history</p>
              <a href="/orders" className="btn-primary inline-flex">Go to Orders</a>
            </div>
          )}

          {tab === 'addresses' && (
            <div className="card p-6 animate-fade-in">
              <h2 className="font-display font-bold text-xl mb-4">Saved Addresses</h2>
              {!user?.addresses?.length
                ? <p className="text-gray-400 text-sm">No saved addresses yet.</p>
                : user.addresses.map((addr, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-4 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="badge-gray">{addr.label}</span>
                        {addr.is_default && <span className="badge-primary">Default</span>}
                      </div>
                      <p className="text-sm text-gray-700">{addr.street}, {addr.city}, {addr.state} {addr.zip_code}</p>
                    </div>
                  ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
