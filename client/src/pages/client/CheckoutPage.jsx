import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { MapPin, CreditCard, Truck, CheckCircle, ShoppingBag } from 'lucide-react'
import api from '@/api/axios'
import { fetchCart } from '@/store/slices/cartSlice'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { id: 'cod',  label: 'Cash on Delivery', icon: '💵' },
  { id: 'upi',  label: 'UPI / Google Pay',  icon: '📱' },
  { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
]

export default function CheckoutPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items, total } = useSelector(s => s.cart)
  const { user } = useSelector(s => s.auth)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [address, setAddress] = useState({
    label: 'Home', street: '', city: '', state: '', country: 'India', zip_code: '', is_default: true
  })

  const shipping = total > 500 ? 0 : 50
  const tax = Math.round(total * 0.18)
  const grandTotal = total + shipping + tax

  const handlePlaceOrder = async () => {
    if (!address.street || !address.city || !address.state || !address.zip_code) {
      toast.error('Please fill all address fields')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/orders', { shipping_address: address, payment_method: paymentMethod })
      dispatch(fetchCart())
      navigate(`/orders/${res.data.data.id}`)
      toast.success('Order placed successfully! 🎉')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'input text-sm py-2.5'

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="section-title mb-8">Checkout</h1>

      {/* Step tabs */}
      <div className="flex items-center gap-0 mb-10">
        {[{ n:1, label:'Address' }, { n:2, label:'Payment' }, { n:3, label:'Review' }].map(({ n, label }, i) => (
          <div key={n} className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors
              ${step >= n ? 'text-primary-600 bg-primary-50' : 'text-gray-400'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${step > n ? 'bg-green-500 text-white' : step === n ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > n ? '✓' : n}
              </span>
              {label}
            </div>
            {i < 2 && <div className={`w-8 h-0.5 ${step > n ? 'bg-green-400' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Step 1: Address */}
          {step === 1 && (
            <div className="card p-6 space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                <h2 className="font-display font-bold text-xl">Delivery Address</h2>
              </div>
              {user?.addresses?.length > 0 && (
                <div className="space-y-2 mb-4">
                  {user.addresses.map((addr, i) => (
                    <label key={i} className="flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer hover:border-primary-300 transition-colors">
                      <input type="radio" name="savedAddr" className="mt-1 accent-primary-500"
                        onChange={() => setAddress(addr)} />
                      <div className="text-sm text-gray-700">
                        <p className="font-semibold">{addr.label}</p>
                        <p>{addr.street}, {addr.city}, {addr.state} {addr.zip_code}</p>
                      </div>
                    </label>
                  ))}
                  <p className="text-xs text-gray-400 font-medium pt-1">— or enter a new address —</p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Street Address *</label>
                  <input className={inputCls} placeholder="123 Main Street, Apt 4B" value={address.street}
                    onChange={e => setAddress(a => ({...a, street: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">City *</label>
                  <input className={inputCls} placeholder="Mumbai" value={address.city}
                    onChange={e => setAddress(a => ({...a, city: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">State *</label>
                  <input className={inputCls} placeholder="Maharashtra" value={address.state}
                    onChange={e => setAddress(a => ({...a, state: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">ZIP Code *</label>
                  <input className={inputCls} placeholder="400001" value={address.zip_code}
                    onChange={e => setAddress(a => ({...a, zip_code: e.target.value}))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Country</label>
                  <input className={inputCls} value={address.country}
                    onChange={e => setAddress(a => ({...a, country: e.target.value}))} />
                </div>
              </div>
              <button onClick={() => setStep(2)} className="btn-primary w-full mt-2">Continue to Payment</button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div className="card p-6 space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-primary-500" />
                <h2 className="font-display font-bold text-xl">Payment Method</h2>
              </div>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(m => (
                  <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${paymentMethod === m.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="accent-primary-500" />
                    <span className="text-xl">{m.icon}</span>
                    <span className="font-semibold text-gray-800">{m.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">Review Order</button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="card p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-primary-500" />
                <h2 className="font-display font-bold text-xl">Review Order</h2>
              </div>
              <div className="space-y-3 mb-5">
                {items.map(item => (
                  <div key={item.product_id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.product?.images?.[0] && <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 line-clamp-1">{item.product?.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-sm text-primary-600">₹{((item.product?.price||0)*item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1 mb-4">
                <p className="font-semibold text-gray-700 mb-2">Delivering to:</p>
                <p className="text-gray-600">{address.street}, {address.city}, {address.state} {address.zip_code}</p>
                <p className="text-gray-600 mt-2 font-medium">Payment: {PAYMENT_METHODS.find(m=>m.id===paymentMethod)?.label}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">Back</button>
                <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Placing...' : `Place Order — ₹${grandTotal.toLocaleString()}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="card p-5 h-fit space-y-3 sticky top-24">
          <h3 className="font-display font-bold text-lg">Order Summary</h3>
          <div className="text-sm space-y-2">
            <div className="flex justify-between text-gray-500"><span>Subtotal ({items.length} items)</span><span className="font-semibold text-gray-800">₹{total.toLocaleString()}</span></div>
            <div className="flex justify-between text-gray-500"><span>Shipping</span><span className={shipping===0?'text-green-600 font-semibold':'font-semibold text-gray-800'}>{shipping===0?'FREE':`₹${shipping}`}</span></div>
            <div className="flex justify-between text-gray-500"><span>Tax (18%)</span><span className="font-semibold text-gray-800">₹{tax.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-3 border-gray-100">
              <span>Grand Total</span>
              <span className="text-primary-600 font-display text-xl">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
