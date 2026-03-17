import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/api/axios'
import toast from 'react-hot-toast'

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data)
    return res.data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Registration failed')
  }
})

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', data)
    return res.data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Login failed')
  }
})

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me')
    return res.data.data
  } catch (err) {
    return rejectWithValue(null)
  }
})

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    await api.put('/users/profile', data)
    const res = await api.get('/auth/me')
    return res.data.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Update failed')
  }
})

const initialState = {
  user: null,
  accessToken: localStorage.getItem('access_token') || null,
  refreshToken: localStorage.getItem('refresh_token') || null,
  loading: false,
  initialized: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      toast.success('Logged out successfully')
    },
    setTokens(state, { payload }) {
      state.accessToken = payload.access_token
      state.refreshToken = payload.refresh_token
      localStorage.setItem('access_token', payload.access_token)
      localStorage.setItem('refresh_token', payload.refresh_token)
    },
  },
  extraReducers: (builder) => {
    builder
      // register
      .addCase(register.pending,   (s) => { s.loading = true })
      .addCase(register.fulfilled, (s, { payload }) => {
        s.loading = false
        s.user = payload.user
        s.accessToken = payload.access_token
        s.refreshToken = payload.refresh_token
        localStorage.setItem('access_token', payload.access_token)
        localStorage.setItem('refresh_token', payload.refresh_token)
        toast.success('Welcome to MarketPro!')
      })
      .addCase(register.rejected, (s, { payload }) => {
        s.loading = false
        toast.error(payload)
      })
      // login
      .addCase(login.pending,   (s) => { s.loading = true })
      .addCase(login.fulfilled, (s, { payload }) => {
        s.loading = false
        s.user = payload.user
        s.accessToken = payload.access_token
        s.refreshToken = payload.refresh_token
        localStorage.setItem('access_token', payload.access_token)
        localStorage.setItem('refresh_token', payload.refresh_token)
        toast.success(`Welcome back, ${payload.user.name}!`)
      })
      .addCase(login.rejected, (s, { payload }) => {
        s.loading = false
        toast.error(payload)
      })
      // fetchMe
      .addCase(fetchMe.fulfilled, (s, { payload }) => {
        s.user = payload
        s.initialized = true
      })
      .addCase(fetchMe.rejected, (s) => {
        s.initialized = true
      })
      // updateProfile
      .addCase(updateProfile.fulfilled, (s, { payload }) => {
        s.user = payload
        toast.success('Profile updated!')
      })
      .addCase(updateProfile.rejected, (s, { payload }) => {
        toast.error(payload)
      })
  },
})

export const { logout, setTokens } = authSlice.actions
export default authSlice.reducer
