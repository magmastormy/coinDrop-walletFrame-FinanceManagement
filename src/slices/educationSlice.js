import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    educations: [],
    loading: false,
    error: null,
    selectedEducation: null
};

const educationSlice = createSlice({
    name: 'education',
    initialState,
    reducers: {
        // Fetch Educations
        setEducations: (state, action) => {
            state.educations = action.payload;
            state.loading = false;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
            if (action.payload === true) {
                state.error = null;
            }
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        setSelectedEducation: (state, action) => {
            state.selectedEducation = action.payload;
        },
        
        // CRUD Operations
        addEducation: (state, action) => {
            state.educations.push(action.payload);
        },
        updateEducation: (state, action) => {
            const index = state.educations.findIndex(e => e._id === action.payload._id);
            if (index !== -1) {
                state.educations[index] = action.payload;
            }
        },
        deleteEducation: (state, action) => {
            state.educations = state.educations.filter(e => e._id !== action.payload);
        },

        // Like/Comment Operations
        addLike: (state, action) => {
            const { educationId, userId } = action.payload;
            const education = state.educations.find(e => e._id === educationId);
            if (education && !education.likes.includes(userId)) {
                education.likes.push(userId);
            }
        },
        removeLike: (state, action) => {
            const { educationId, userId } = action.payload;
            const education = state.educations.find(e => e._id === educationId);
            if (education) {
                education.likes = education.likes.filter(id => id !== userId);
            }
        },
        addComment: (state, action) => {
            const { educationId, comment } = action.payload;
            const education = state.educations.find(e => e._id === educationId);
            if (education) {
                education.comments.push(comment);
            }
        },
        deleteComment: (state, action) => {
            const { educationId, commentId } = action.payload;
            const education = state.educations.find(e => e._id === educationId);
            if (education) {
                education.comments = education.comments.filter(c => c._id !== commentId);
            }
        }
    }
});

export const {
    setEducations,
    setLoading,
    setError,
    setSelectedEducation,
    addEducation,
    updateEducation,
    deleteEducation,
    addLike,
    removeLike,
    addComment,
    deleteComment
} = educationSlice.actions;

export default educationSlice.reducer;