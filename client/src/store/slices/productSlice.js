import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/api/axios'

export const fetchProducts = createAsyncThunk('products/fetchAll', async (params = {}) => {
  const res = await api.get('/products', { params })
  return res.data
})

export const fetchProduct = createAsyncThunk('products/fetchOne', async (id) => {
  const res = await api.get(`/products/${id}`)
  return res.data.data
})

export const fetchCategories = createAsyncThunk('products/fetchCategories', async () => {
  const res = await api.get('/categories')
  return res.data.data
})

export const fetchBrands = createAsyncThunk('products/fetchBrands', async () => {
  const res = await api.get('/brands')
  return res.data.data
})

const productSlice = createSlice({
  name: 'products',
  initialState: {
    list: [],
    currentProduct: null,
    categories: [],
    brands: [],
    pagination: {},
    filters: { sort: 'createdAt', page: 1 },
    loading: false,
    productLoading: false,
  },
  reducers: {
    setFilters(state, { payload }) {
      state.filters = { ...state.filters, ...payload }
    },
    clearCurrentProduct(state) {
      state.currentProduct = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,   (s) => { s.loading = true })
      .addCase(fetchProducts.fulfilled, (s, { payload }) => {
        s.loading = false
        s.list = payload.data
        s.pagination = payload.pagination
      })
      .addCase(fetchProducts.rejected,  (s) => { s.loading = false })
      .addCase(fetchProduct.pending,    (s) => { s.productLoading = true })
      .addCase(fetchProduct.fulfilled,  (s, { payload }) => {
        s.productLoading = false
        s.currentProduct = payload
      })
      .addCase(fetchProduct.rejected,   (s) => { s.productLoading = false })
      .addCase(fetchCategories.fulfilled, (s, { payload }) => { s.categories = payload })
      .addCase(fetchBrands.fulfilled,     (s, { payload }) => { s.brands = payload })
  },
})

export const { setFilters, clearCurrentProduct } = productSlice.actions
export default productSlice.reducer
