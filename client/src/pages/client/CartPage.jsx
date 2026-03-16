// ─── CartPage.jsx ──────────────────────────────────────────────────────────────
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { updateCartItem, clearCart } from '@/store/slices/cartSlice'

export function CartPage() {
  const dispatch = useDispatch()
  const { items, total, loading } = useSelector(s => s.cart)

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-16 text-center"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" /></div>

  if (!items.length) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <ShoppingCart className="w-20 h-20 text-gray-200 mx-auto mb-6" />
      <h2 className="font-display text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
      <p className="text-gray-400 mb-8">Start shopping to add items to your cart</p>
      <Link to="/products" className="btn-primary">Continue Shopping</Link>
    </div>
  )

  const shipping = total > 500 ? 0 : 50
  const tax = Math.round(total * 0.18)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="section-title mb-8">Shopping Cart <span className="text-gray-400 text-2xl font-body font-normal">({items.length} items)</span></h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={`${item.product_id}-${item.variant}`} className="card p-5 flex gap-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {item.product?.images?.[0] ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" /> : <ShoppingCart className="w-8 h-8 text-gray-300 m-auto mt-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 line-clamp-2">{item.product?.name}</h3>
                {item.variant && <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                    <button onClick={() => dispatch(updateCartItem({ productId: item.product_id, quantity: item.quantity - 1 }))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200">
                      {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                    </button>
                    <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                    <button onClick={() => dispatch(updateCartItem({ productId: item.product_id, quantity: item.quantity + 1 }))} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="font-display font-bold text-lg text-primary-600">₹{((item.product?.price || 0) * item.quantity).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => dispatch(clearCart())} className="text-sm text-red-500 hover:text-red-700 font-medium">Clear cart</button>
        </div>

        <div className="card p-6 h-fit space-y-4 sticky top-24">
          <h3 className="font-display font-bold text-xl">Order Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{total.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className={shipping === 0 ? 'text-green-600 font-semibold' : 'font-semibold'}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax (18%)</span><span className="font-semibold">₹{tax.toLocaleString()}</span></div>
            <div className="flex justify-between font-bold text-base pt-3 border-t border-gray-100">
              <span>Total</span><span className="text-primary-600 font-display text-xl">₹{(total + shipping + tax).toLocaleString()}</span>
            </div>
          </div>
          <Link to="/checkout" className="btn-primary w-full justify-between">Proceed to Checkout <ArrowRight className="w-4 h-4" /></Link>
          <Link to="/products" className="btn-ghost w-full justify-center text-sm">Continue Shopping</Link>
        </div>
      </div>
    </div>
  )
}

export default CartPage
