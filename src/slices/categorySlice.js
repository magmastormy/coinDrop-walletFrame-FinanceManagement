import { createSlice } from '@reduxjs/toolkit';

const initialState ={
   categories: [],
   loading: false,
   error: null,
};

const categorySlice = createSlice({
   name: 'category',
   initialState,
   reducers: {
       setCategories: (state, action) => {
           state.categories = action.payload;
           state.loading = false;
       },
       setLoading: (state, action) => {
           state.loading = action.payload;
       },
       setError: (state, action) => {
           state.error = action.payload;
           state.loading = false;
       },
   }
});

export const { setCategories, setLoading, setError } = categorySlice.actions;
export default categorySlice.reducer;