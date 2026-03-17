import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import {
  MapPin, CreditCard, CheckCircle, ArrowRight,
  Smartphone, Banknote, Shield, Lock, AlertCircle
} from 'lucide-react'
import { fetchCart } from '@/store/slices/cartSlice'
import api from '@/api/axios'
import toast from 'react-hot-toast'

/* ─────────────────────────────────────────────────────────────────────────────
   Razorpay helper — loads the SDK script on demand
───────────────────────────────────────────────────────────────────────────── */
function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/* ─────────────────────────────────────────────────────────────────────────────
   Stripe helper — loads Stripe.js on demand
───────────────────────────────────────────────────────────────────────────── */
function loadStripe(publishableKey) {
  return new Promise(resolve => {
    if (window.Stripe) { resolve(window.Stripe(publishableKey)); return }
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.onload  = () => resolve(window.Stripe(publishableKey))
    script.onerror = () => resolve(null)
    document.body.appendChild(script)
  })
}

/* ─────────────────────────────────────────────────────────────────────────────
   Step indicator
───────────────────────────────────────────────────────────────────────────── */
function StepBar({ step }) {
  const steps = [{ n:1, label:'Address' }, { n:2, label:'Payment' }, { n:3, label:'Review' }]
  return (
    <div className="flex items-center gap-0 mb-10">
      {steps.map(({ n, label }, i) => (
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
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   UPI payment panel
───────────────────────────────────────────────────────────────────────────── */
function UpiPanel({ orderId, amount, upiConfig, onSuccess }) {
  const [utr, setUtr]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  const deepLink = upiConfig?.deep_link_template?.replace('{amount}', amount) || '#'

  const handleSubmit = async () => {
    if (!utr.trim() || utr.trim().length < 6) {
      toast.error('Please enter your 12-digit UTR / UPI reference number')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/payment/upi/confirm', { order_id: orderId, utr_number: utr.trim() })
      toast.success('UPI reference submitted! We will verify and confirm your order.')
      onSuccess()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      {/* QR / deep link */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
        <Smartphone className="w-10 h-10 text-blue-500 mx-auto mb-3" />
        <p className="font-semibold text-blue-900 mb-1">Pay via UPI</p>
        <p className="text-sm text-blue-700 mb-3">
          UPI ID: <strong className="font-mono">{upiConfig?.upi_id}</strong>
        </p>
        <p className="text-xs text-blue-600 mb-3">Amount: <strong>₹{amount.toLocaleString()}</strong></p>
        <a href={deepLink}
          className="btn-primary text-sm py-2 inline-flex mx-auto"
          onClick={() => toast('Opening UPI app…', { icon: '📱' })}>
          Open UPI App &nbsp;→
        </a>
        <p className="text-xs text-blue-500 mt-3">
          Works with GPay, PhonePe, Paytm, BHIM, any UPI app
        </p>
      </div>

      {/* UTR input */}
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1.5">
          Enter UTR / Transaction Reference Number *
        </label>
        <input
          className="input text-sm py-2.5"
          placeholder="e.g. 123456789012 (12 digits)"
          value={utr}
          onChange={e => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
        />
        <p className="text-xs text-gray-400 mt-1">
          After paying, find the transaction ID in your UPI app and enter it above
        </p>
      </div>

      <button onClick={handleSubmit} disabled={submitting || !utr.trim()}
        className="btn-primary w-full py-3 disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Confirm UPI Payment'}
      </button>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main CheckoutPage
───────────────────────────────────────────────────────────────────────────── */
export default function CheckoutPage() {
  const dispatch     = useDispatch()
  const navigate     = useNavigate()
  const { items, total } = useSelector(s => s.cart)
  const { user }     = useSelector(s => s.auth)

  const [step, setStep]             = useState(1)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [payConfig, setPayConfig]   = useState({ enabled: { cod: true } })
  const [placedOrderId, setPlacedOrderId] = useState(null)
  const [upiMode, setUpiMode]       = useState(false)   // after order placed, show UPI panel

  const [address, setAddress] = useState({
    label: 'Home', street: '', city: '', state: '', country: 'India', zip_code: '', is_default: true,
  })

  const shipping   = total > 500 ? 0 : 50
  const tax        = Math.round(total * 0.18)
  const grandTotal = total + shipping + tax

  // Load payment config from server
  useEffect(() => {
    api.get('/payment/config')
      .then(r => setPayConfig(r.data.data))
      .catch(() => {})
  }, [])

  const PAYMENT_METHODS = [
    { id: 'cod',       label: 'Cash on Delivery',   icon: <Banknote className="w-5 h-5 text-green-600" />,   enabled: true },
    { id: 'upi',       label: 'UPI / Google Pay',    icon: <Smartphone className="w-5 h-5 text-blue-600" />,  enabled: payConfig.enabled?.upi || !!import.meta.env.VITE_UPI_ID },
    { id: 'razorpay',  label: 'Razorpay (Card/UPI)', icon: <CreditCard className="w-5 h-5 text-primary-600" />, enabled: payConfig.enabled?.razorpay || !!import.meta.env.VITE_RAZORPAY_KEY_ID },
    { id: 'stripe',    label: 'Stripe (Card)',       icon: <Lock className="w-5 h-5 text-purple-600" />,       enabled: payConfig.enabled?.stripe || !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY },
  ].filter(m => m.enabled)

  /* ── Step 1: validate address ─────────────────────────────────────────── */
  const handleAddressNext = () => {
    if (!address.street || !address.city || !address.state || !address.zip_code) {
      toast.error('Please fill all required address fields')
      return
    }
    setStep(2)
  }

  /* ── Place the order on server first (status = pending / awaiting payment) */
  const placeOrderOnServer = async () => {
    const res = await api.post('/orders', {
      shipping_address: address,
      payment_method:   paymentMethod,
    })
    return res.data.data  // { id, total, ... }
  }

  /* ── COD: place order immediately ─────────────────────────────────────── */
  const handleCOD = async () => {
    setPlacingOrder(true)
    try {
      const order = await placeOrderOnServer()
      dispatch(fetchCart())
      toast.success('Order placed! 🎉')
      navigate(`/orders/${order.id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to place order')
    }
    setPlacingOrder(false)
  }

  /* ── Razorpay ──────────────────────────────────────────────────────────── */
  const handleRazorpay = async () => {
    setPlacingOrder(true)
    try {
      // 1. Create our order first
      const order = await placeOrderOnServer()

      // 2. Create Razorpay order
      const rzRes = await api.post('/payment/razorpay/create-order', {
        amount:   grandTotal,
        order_id: order.id,
      })
      const { razorpay_order_id, key_id } = rzRes.data.data

      // 3. Load Razorpay SDK
      const loaded = await loadRazorpay()
      if (!loaded) throw new Error('Razorpay SDK failed to load')

      // 4. Open Razorpay checkout
      await new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          key:          key_id,
          amount:       grandTotal * 100,
          currency:     'INR',
          name:         'MarketPro',
          description:  `Order #${order.id.slice(-8).toUpperCase()}`,
          order_id:     razorpay_order_id,
          prefill: {
            name:  user?.name  || '',
            email: user?.email || '',
          },
          theme: { color: '#f97316' },
          handler: async (response) => {
            try {
              // 5. Verify signature on server
              await api.post('/payment/razorpay/verify', {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                order_id:            order.id,
              })
              dispatch(fetchCart())
              toast.success('Payment successful! 🎉')
              navigate(`/orders/${order.id}`)
              resolve()
            } catch (e) {
              reject(e)
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
        })
        rzp.open()
      })
    } catch (err) {
      if (err.message !== 'Payment cancelled') {
        toast.error(err.response?.data?.detail || err.message || 'Payment failed')
      }
    }
    setPlacingOrder(false)
  }

  /* ── Stripe ───────────────────────────────────────────────────────────── */
  const handleStripe = async () => {
    setPlacingOrder(true)
    try {
      const publishableKey = payConfig.stripe_publishable_key
        || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

      if (!publishableKey) throw new Error('Stripe publishable key not configured')

      // 1. Create our order
      const order = await placeOrderOnServer()

      // 2. Create payment intent
      const intentRes = await api.post('/payment/stripe/create-intent', {
        amount:   grandTotal,
        order_id: order.id,
      })
      const { client_secret, payment_intent_id } = intentRes.data.data

      // 3. Load Stripe.js
      const stripe = await loadStripe(publishableKey)
      if (!stripe) throw new Error('Stripe.js failed to load')

      // 4. Confirm payment — opens Stripe's hosted flow
      const { error } = await stripe.confirmPayment({
        clientSecret: client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/orders/${order.id}?stripe_verify=1&pi=${payment_intent_id}`,
        },
      })

      if (error) throw new Error(error.message)
      // Stripe redirects — success handled on the order page
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Stripe payment failed')
    }
    setPlacingOrder(false)
  }

  /* ── UPI (manual) ─────────────────────────────────────────────────────── */
  const handleUpiStart = async () => {
    setPlacingOrder(true)
    try {
      const order = await placeOrderOnServer()
      setPlacedOrderId(order.id)
      setUpiMode(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create order')
    }
    setPlacingOrder(false)
  }

  /* ── Master handler ────────────────────────────────────────────────────── */
  const handlePlaceOrder = async () => {
    if (paymentMethod === 'cod')      return handleCOD()
    if (paymentMethod === 'razorpay') return handleRazorpay()
    if (paymentMethod === 'stripe')   return handleStripe()
    if (paymentMethod === 'upi')      return handleUpiStart()
  }

  const inputCls = 'input text-sm py-2.5'

  /* ── UPI confirmation screen ─────────────────────────────────────────── */
  if (upiMode && placedOrderId) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="section-title mb-6">Complete UPI Payment</h1>
        <UpiPanel
          orderId={placedOrderId}
          amount={grandTotal}
          upiConfig={payConfig}
          onSuccess={() => {
            dispatch(fetchCart())
            navigate(`/orders/${placedOrderId}`)
          }}
        />
        <Link to={`/orders/${placedOrderId}`} className="btn-secondary w-full mt-4 justify-center">
          Skip for now — pay later
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="section-title mb-8">Checkout</h1>
      <StepBar step={step} />

      {/* Empty cart guard */}
      {items.length === 0 && (
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold mb-2">Your cart is empty</p>
          <Link to="/products" className="btn-primary mt-2 inline-flex">Browse Products</Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

            {/* ── Step 1: Address ── */}
            {step === 1 && (
              <div className="card p-6 space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  <h2 className="font-display font-bold text-xl">Delivery Address</h2>
                </div>

                {/* Saved addresses */}
                {user?.addresses?.length > 0 && (
                  <div className="space-y-2 mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Saved Addresses</p>
                    {user.addresses.map((addr, i) => (
                      <label key={i} className="flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer hover:border-primary-300 transition-colors">
                        <input type="radio" name="savedAddr" className="mt-1 accent-primary-500"
                          onChange={() => setAddress({ ...addr })} />
                        <div className="text-sm text-gray-700">
                          <p className="font-semibold">{addr.label}</p>
                          <p>{addr.street}, {addr.city}, {addr.state} {addr.zip_code}</p>
                        </div>
                      </label>
                    ))}
                    <p className="text-xs text-gray-400 pt-1">— or enter a new address below —</p>
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
                    <label className="text-xs font-semibold text-gray-600 block mb-1">PIN Code *</label>
                    <input className={inputCls} placeholder="400001" value={address.zip_code}
                      onChange={e => setAddress(a => ({...a, zip_code: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Country</label>
                    <input className={inputCls} value={address.country}
                      onChange={e => setAddress(a => ({...a, country: e.target.value}))} />
                  </div>
                </div>
                <button onClick={handleAddressNext} className="btn-primary w-full mt-2">
                  Continue to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── Step 2: Payment ── */}
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
                      <input type="radio" name="payment" checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(m.id)} className="accent-primary-500" />
                      {m.icon}
                      <div>
                        <p className="font-semibold text-gray-800">{m.label}</p>
                        {m.id === 'cod'      && <p className="text-xs text-gray-400">Pay when your order arrives</p>}
                        {m.id === 'upi'      && <p className="text-xs text-gray-400">GPay, PhonePe, Paytm, BHIM, any UPI app</p>}
                        {m.id === 'razorpay' && <p className="text-xs text-gray-400">Debit/Credit Card, NetBanking, UPI via Razorpay</p>}
                        {m.id === 'stripe'   && <p className="text-xs text-gray-400">International cards via Stripe</p>}
                      </div>
                      {m.id === 'razorpay' && (
                        <img src="https://razorpay.com/favicon.png" alt="Razorpay" className="w-5 h-5 ml-auto" />
                      )}
                      {m.id === 'stripe' && (
                        <Shield className="w-5 h-5 text-purple-400 ml-auto" />
                      )}
                    </label>
                  ))}
                </div>

                {/* Security badge */}
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
                  <Lock className="w-4 h-4 text-green-500 flex-shrink-0" />
                  All transactions are encrypted and secure
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                  <button onClick={() => setStep(3)} className="btn-primary flex-1">Review Order</button>
                </div>
              </div>
            )}

            {/* ── Step 3: Review & Place ── */}
            {step === 3 && (
              <div className="card p-6 animate-fade-in">
                <div className="flex items-center gap-2 mb-5">
                  <CheckCircle className="w-5 h-5 text-primary-500" />
                  <h2 className="font-display font-bold text-xl">Review & Place Order</h2>
                </div>

                {/* Items */}
                <div className="space-y-3 mb-5 max-h-60 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.product_id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.product?.images?.[0] && (
                          <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.product?.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity} × ₹{item.product?.price?.toLocaleString()}</p>
                      </div>
                      <span className="font-bold text-sm text-primary-600 flex-shrink-0">
                        ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Delivering to</span>
                    <span className="font-medium text-gray-800 text-right max-w-[60%]">
                      {address.street}, {address.city}, {address.state} {address.zip_code}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Payment via</span>
                    <span className="font-semibold text-gray-800 capitalize">
                      {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label || paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Razorpay note */}
                {paymentMethod === 'razorpay' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-xs text-orange-700 flex items-center gap-2">
                    <Shield className="w-4 h-4 flex-shrink-0" />
                    Razorpay secure checkout will open after you click the button below
                  </div>
                )}

                {/* Stripe note */}
                {paymentMethod === 'stripe' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4 text-xs text-purple-700 flex items-center gap-2">
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    You'll be redirected to Stripe's secure payment page
                  </div>
                )}

                {/* UPI note */}
                {paymentMethod === 'upi' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-700 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 flex-shrink-0" />
                    After placing the order, you'll see UPI payment instructions
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="btn-secondary flex-1" disabled={placingOrder}>
                    Back
                  </button>
                  <button onClick={handlePlaceOrder} disabled={placingOrder} className="btn-primary flex-1 py-3">
                    {placingOrder
                      ? 'Processing...'
                      : paymentMethod === 'cod'
                        ? `Place Order — ₹${grandTotal.toLocaleString()}`
                        : `Pay ₹${grandTotal.toLocaleString()}`
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Order Summary sidebar ── */}
          <div className="card p-5 h-fit space-y-3 sticky top-24">
            <h3 className="font-display font-bold text-lg">Order Summary</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal ({items.length} item{items.length !== 1 ? 's' : ''})</span>
                <span className="font-semibold text-gray-800">₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-semibold' : 'font-semibold text-gray-800'}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Tax (18%)</span>
                <span className="font-semibold text-gray-800">₹{tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-3 border-gray-100">
                <span>Grand Total</span>
                <span className="text-primary-600 font-display text-xl">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
            {shipping === 0 && (
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                ✓ You qualify for free shipping!
              </p>
            )}
            {shipping > 0 && (
              <p className="text-xs text-gray-400">
                Add ₹{(500 - total).toLocaleString()} more for free shipping
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
