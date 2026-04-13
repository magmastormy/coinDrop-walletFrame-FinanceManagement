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
            // Ensure we only store serializable data (array of education objects)
            state.educations = Array.isArray(action.payload) ? action.payload : 
                         (action.payload?.data && Array.isArray(action.payload.data)) ? action.payload.data :
                         (action.payload?.educations && Array.isArray(action.payload.educations)) ? action.payload.educations :
                         [];
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
            const educationIndex = state.educations.findIndex(e => e._id === educationId);
            if (educationIndex !== -1) {
                const education = state.educations[educationIndex];
                const likes = education.likes || [];
                if (!likes.includes(userId)) {
                    state.educations[educationIndex] = {
                        ...education,
                        likes: [...likes, userId]
                    };
                }
            }
        },
        removeLike: (state, action) => {
            const { educationId, userId } = action.payload;
            const educationIndex = state.educations.findIndex(e => e._id === educationId);
            if (educationIndex !== -1) {
                const education = state.educations[educationIndex];
                state.educations[educationIndex] = {
                    ...education,
                    likes: (education.likes || []).filter(id => id !== userId)
                };
            }
        },
        addComment: (state, action) => {
            const { educationId, comment } = action.payload;
            const educationIndex = state.educations.findIndex(e => e._id === educationId);
            if (educationIndex !== -1) {
                const education = state.educations[educationIndex];
                const comments = education.comments || [];
                state.educations[educationIndex] = {
                    ...education,
                    comments: [...comments, comment]
                };
            }
        },
        deleteComment: (state, action) => {
            const { educationId, commentId } = action.payload;
            const educationIndex = state.educations.findIndex(e => e._id === educationId);
            if (educationIndex !== -1) {
                const education = state.educations[educationIndex];
                state.educations[educationIndex] = {
                    ...education,
                    comments: (education.comments || []).filter(c => c._id !== commentId)
                };
            }
        },

        updateEditorContent: (state, action) => {
            const { id, content } = action.payload;
            const educationIndex = state.educations.findIndex(e => e._id === id);
            if (educationIndex !== -1) {
                const education = state.educations[educationIndex];
                state.educations[educationIndex] = {
                    ...education,
                    details: content
                };
            }
        },

        addImageToPost: (state, action) => {
            const { id, imageUrl } = action.payload;
            const educationIndex = state.educations.findIndex(e => e._id === id);
            if (educationIndex !== -1) {
                const education = state.educations[educationIndex];
                const images = education.images || [];
                state.educations[educationIndex] = {
                    ...education,
                    images: [...images, {
                        url: imageUrl,
                        alt: '',
                        caption: ''
                    }]
                };
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
