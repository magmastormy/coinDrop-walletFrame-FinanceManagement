import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    profile: null,
    loading: false,
    error: null,
    followers: [],
    following: []
};

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        // Fetch Profile
        fetchProfileStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchProfileSuccess: (state, action) => {
            state.loading = false;
            state.profile = action.payload;
            state.error = null;
        },
        fetchProfileFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
            state.profile = null;
        },

        // Update Profile
        updateProfileStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        updateProfileSuccess: (state, action) => {
            state.loading = false;
            state.profile = action.payload;
            state.error = null;
        },
        updateProfileFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        // Create Profile
        createProfileStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        createProfileSuccess: (state, action) => {
            state.loading = false;
            state.profile = action.payload;
            state.error = null;
        },
        createProfileFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        // Followers/Following
        fetchFollowersSuccess: (state, action) => {
            state.followers = action.payload;
            state.error = null;
        },
        fetchFollowingSuccess: (state, action) => {
            state.following = action.payload;
            state.error = null;
        },

        // Clear Profile
        clearProfile: (state) => {
            state.profile = null;
            state.error = null;
            state.followers = [];
            state.following = [];
        }
    },
});

export const {
    fetchProfileStart,
    fetchProfileSuccess,
    fetchProfileFailure,
    updateProfileStart,
    updateProfileSuccess,
    updateProfileFailure,
    createProfileStart,
    createProfileSuccess,
    createProfileFailure,
    fetchFollowersSuccess,
    fetchFollowingSuccess,
    clearProfile
} = profileSlice.actions;

export default profileSlice.reducer;