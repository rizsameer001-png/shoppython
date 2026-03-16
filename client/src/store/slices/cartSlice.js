// ─── cartSlice.js ─────────────────────────────────────────────────────────────
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/api/axios'
import toast from 'react-hot-toast'

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { getState }) => {
  const { auth } = getState()
  if (!auth.user) return { items: [], total: 0, item_count: 0 }
  const res = await api.get('/cart')
  return res.data.data
})

export const addToCart = createAsyncThunk('cart/add', async (payload, { dispatch, getState }) => {
  const { auth } = getState()
  if (!auth.user) { toast.error('Please login to add to cart'); return }
  await api.post('/cart/add', payload)
  toast.success('Added to cart!')
  dispatch(fetchCart())
})

export const updateCartItem = createAsyncThunk('cart/update', async ({ productId, quantity }, { dispatch }) => {
  await api.put(`/cart/${productId}`, { quantity })
  dispatch(fetchCart())
})

export const clearCart = createAsyncThunk('cart/clear', async (_, { dispatch }) => {
  await api.delete('/cart')
  dispatch(fetchCart())
})

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], total: 0, item_count: 0, loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending,   (s) => { s.loading = true })
      .addCase(fetchCart.fulfilled, (s, { payload }) => {
        s.loading = false
        s.items = payload.items || []
        s.total = payload.total || 0
        s.item_count = payload.item_count || 0
      })
      .addCase(fetchCart.rejected,  (s) => { s.loading = false })
  },
})

export default cartSlice.reducer
