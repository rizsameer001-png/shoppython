import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { closeCart } from '@/store/slices/uiSlice'
import { updateCartItem } from '@/store/slices/cartSlice'

export default function CartDrawer() {
  const dispatch = useDispatch()
  const { cartOpen } = useSelector((s) => s.ui)
  const { items, total, loading } = useSelector((s) => s.cart)

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${cartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => dispatch(closeCart())}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col
        transition-transform duration-300 ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary-500" />
            <h2 className="font-display font-bold text-lg text-gray-900">Your Cart</h2>
            {items.length > 0 && (
              <span className="badge-primary">{items.length}</span>
            )}
          </div>
          <button onClick={() => dispatch(closeCart())} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="skeleton w-16 h-16 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 rounded w-3/4" />
                    <div className="skeleton h-3 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-gray-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">Add some products to get started</p>
              </div>
              <Link to="/products" onClick={() => dispatch(closeCart())} className="btn-primary text-sm py-2">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.variant}`} className="flex gap-3 group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.product?.images?.[0] ? (
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 line-clamp-2">{item.product?.name}</p>
                    {item.variant && <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary-600 font-bold text-sm">
                        ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2 py-1">
                        <button
                          onClick={() => dispatch(updateCartItem({ productId: item.product_id, quantity: item.quantity - 1 }))}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                        >
                          {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                        </button>
                        <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => dispatch(updateCartItem({ productId: item.product_id, quantity: item.quantity + 1 }))}
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">₹{total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Shipping</span>
              <span className={total > 500 ? 'text-green-600 font-semibold' : 'font-semibold text-gray-900'}>
                {total > 500 ? 'FREE' : '₹50'}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-3">
              <span>Total</span>
              <span className="text-primary-600">₹{(total + (total > 500 ? 0 : 50)).toLocaleString()}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => dispatch(closeCart())}
              className="btn-primary w-full justify-between"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/cart"
              onClick={() => dispatch(closeCart())}
              className="btn-secondary w-full justify-center text-sm py-2"
            >
              View Cart
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
