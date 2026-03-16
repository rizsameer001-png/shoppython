import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    cartOpen:   false,
    menuOpen:   false,
    searchOpen: false,
  },
  reducers: {
    toggleCart:   (s) => { s.cartOpen   = !s.cartOpen },
    closeCart:    (s) => { s.cartOpen   = false },
    toggleMenu:   (s) => { s.menuOpen   = !s.menuOpen },
    closeMenu:    (s) => { s.menuOpen   = false },
    toggleSearch: (s) => { s.searchOpen = !s.searchOpen },
    closeSearch:  (s) => { s.searchOpen = false },
  },
})

export const { toggleCart, closeCart, toggleMenu, closeMenu, toggleSearch, closeSearch } = uiSlice.actions
export default uiSlice.reducer
