import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/api/axios'
import toast from 'react-hot-toast'

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, { getState }) => {
  const { auth } = getState()
  if (!auth.user) return []
  const res = await api.get('/wishlist')
  return res.data.data
})

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (productId, { dispatch, getState }) => {
  const { auth } = getState()
  if (!auth.user) { toast.error('Please login to add to wishlist'); return }
  const res = await api.post('/wishlist/toggle', { product_id: productId })
  const { is_wishlisted, message } = res.data
  toast.success(message)
  dispatch(fetchWishlist())
  return { productId, is_wishlisted }
})

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: [], ids: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending,   (s) => { s.loading = true })
      .addCase(fetchWishlist.fulfilled, (s, { payload }) => {
        s.loading = false
        s.items = payload
        s.ids = payload.map((i) => i.product_id)
      })
      .addCase(fetchWishlist.rejected,  (s) => { s.loading = false })
  },
})

export default wishlistSlice.reducer
