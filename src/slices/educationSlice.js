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
        setEducations: (state, action) => {
            state.educations = action.payload?.data || action.payload || [];
            state.loading = false;
            state.error = null;
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
        },

        updateEditorContent: (state, action) => {
            const { id, content } = action.payload;
            const education = state.educations.find(e => e._id === id);
            if (education) {
                education.details = content;
            }
        },

        addImageToPost: (state, action) => {
            const { id, imageUrl } = action.payload;
            const education = state.educations.find(e => e._id === id);
            if (education) {
                education.images = education.images || [];
                education.images.push({
                    url: imageUrl,
                    alt: '',
                    caption: ''
                });
            }
        },

        removeEducation: (state, action) => {
            state.educations = state.educations.filter(education => education._id !== action.payload);
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
    deleteComment,
    updateEditorContent,
    addImageToPost,
    removeEducation
} = educationSlice.actions;

export default educationSlice.reducer;
