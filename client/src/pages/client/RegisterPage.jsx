import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '@/store/slices/authSlice'
import { ShoppingCart, User, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector(s => s.auth)
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'' })
  const [showPw, setShowPw] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    const result = await dispatch(register(form))
    if (!result.error) navigate('/')
  }

  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}))

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-primary">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-400 mt-2">Join MarketPro today</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handle} className="space-y-4">
            {[
              { key:'name',     label:'Full Name',      icon:User,  type:'text',     placeholder:'John Doe' },
              { key:'email',    label:'Email Address',  icon:Mail,  type:'email',    placeholder:'you@example.com' },
              { key:'phone',    label:'Phone (optional)',icon:Phone, type:'tel',     placeholder:'+91 98765 43210' },
            ].map(({ key, label, icon: Icon, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type={type} className="input pl-10" placeholder={placeholder}
                    required={key !== 'phone'} value={form[key]} onChange={set(key)} />
                </div>
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} required className="input pl-10 pr-10" placeholder="Min 6 characters"
                  value={form.password} onChange={set('password')} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-sm text-gray-500 text-center mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
