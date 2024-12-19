import { createSlice } from '@reduxjs/toolkit';

const profileSlice = createSlice({
    name: 'profile',
    initialState: {
        profile: null,
        loading: false,
        error: null
    },
    reducers: {
        setProfile: (state, action) => {
            state.profile = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearProfile: (state) => {
            state.profile = null;
            state.loading = false;
            state.error = null;
        }
    }
});

export const { setProfile, setLoading, setError, clearProfile } = profileSlice.actions;

export default profileSlice.reducer;