import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { Package, Truck, MapPin, CreditCard, ChevronLeft, RefreshCw } from 'lucide-react'
import api from '@/api/axios'
import toast from 'react-hot-toast'

const STATUS_STEPS = ['pending','confirmed','processing','shipped','delivered']

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [returnModal, setReturnModal] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Handle Stripe redirect verification
    const stripeVerify = searchParams.get('stripe_verify')
    const pi           = searchParams.get('pi')
    if (stripeVerify === '1' && pi) {
      api.post('/payment/stripe/verify', { payment_intent_id: pi, order_id: id })
        .then(() => toast.success('Payment verified! 🎉'))
        .catch(() => toast.error('Could not verify Stripe payment — please contact support'))
    }

    api.get(`/orders/${id}`).then(r => { setOrder(r.data.data); setLoading(false) }).catch(() => setLoading(false))
  }, [id])

  const handleReturn = async () => {
    if (!returnReason.trim()) { toast.error('Please enter a reason'); return }
    setSubmitting(true)
    try {
      await api.post(`/orders/${id}/return`, { order_id: id, reason: returnReason })
      toast.success('Return request submitted!')
      setReturnModal(false)
      const r = await api.get(`/orders/${id}`)
      setOrder(r.data.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit return')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" /></div>
  if (!order) return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500">Order not found</div>

  const currentStep = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Orders
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Order #{order.id?.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-gray-400 mt-1">Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
        {order.status === 'delivered' && (
          <button onClick={() => setReturnModal(true)} className="btn-secondary py-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Return
          </button>
        )}
      </div>

      {/* Progress tracker */}
      {!['cancelled','returned','refunded'].includes(order.status) && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-5">Order Progress</h3>
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${i <= currentStep ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs capitalize font-medium ${i <= currentStep ? 'text-primary-600' : 'text-gray-400'}`}>
                    {step}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${i < currentStep ? 'bg-primary-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          {order.tracking_number && (
            <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
              📦 Tracking: <span className="font-mono font-semibold text-gray-900">{order.tracking_number}</span>
            </p>
          )}
        </div>
      )}

      {/* Items */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary-500" /> Order Items
        </h3>
        <div className="space-y-4">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 line-clamp-1">{item.name}</p>
                {/* attribute chips */}
                {item.selected_attributes?.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {item.selected_attributes.map((a, ai) => (
                      <span key={ai} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {a.name}: {a.value}
                      </span>
                    ))}
                  </div>
                ) : item.variant ? (
                  <p className="text-xs text-gray-400">{item.variant}</p>
                ) : null}
                <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
              </div>
              <span className="font-bold text-primary-600 text-sm">₹{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
          <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="font-semibold text-gray-800">₹{order.subtotal?.toLocaleString()}</span></div>
          <div className="flex justify-between text-gray-500"><span>Shipping</span><span className="font-semibold text-gray-800">{order.shipping === 0 ? 'FREE' : `₹${order.shipping}`}</span></div>
          <div className="flex justify-between text-gray-500"><span>Tax</span><span className="font-semibold text-gray-800">₹{order.tax?.toLocaleString()}</span></div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
            <span>Total</span>
            <span className="text-primary-600 font-display text-xl">₹{order.total?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Address + Payment */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary-500" /> Delivery Address</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{order.shipping_address?.street}</p>
            <p>{order.shipping_address?.city}, {order.shipping_address?.state}</p>
            <p>{order.shipping_address?.zip_code}, {order.shipping_address?.country}</p>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary-500" /> Payment</h3>
          <p className="text-sm text-gray-600 capitalize">{order.payment_method?.replace('_',' ')}</p>
          <p className={`text-xs mt-1 font-semibold ${order.payment_status==='paid' ? 'text-green-600' : 'text-yellow-600'}`}>
            {order.payment_status?.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Return modal */}
      {returnModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setReturnModal(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-50 max-w-md mx-auto shadow-2xl animate-scale-in">
            <h3 className="font-display font-bold text-xl mb-4">Request Return</h3>
            <textarea
              rows={4}
              className="input text-sm resize-none"
              placeholder="Please describe the reason for return..."
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setReturnModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReturn} disabled={submitting} className="btn-primary flex-1">
                {submitting ? 'Submitting...' : 'Submit Return'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
