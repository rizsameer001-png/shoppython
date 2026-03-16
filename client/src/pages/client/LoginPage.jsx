import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '@/store/slices/authSlice'
import { ShoppingCart, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading } = useSelector(s => s.auth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    const result = await dispatch(login(form))
    if (!result.error) navigate('/')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-primary">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-400 mt-2">Sign in to your MarketPro account</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handle} className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" required className="input pl-10" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} required className="input pl-10 pr-10" placeholder="••••••••"
                  value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">Create one</Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-primary-50 rounded-xl text-xs text-primary-700 text-center">
            <p className="font-semibold">Demo Admin:</p>
            <p>admin@marketpro.com / Admin@123456</p>
          </div>
        </div>
      </div>
    </div>
  )
}
