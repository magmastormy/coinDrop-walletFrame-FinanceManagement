import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isLoading: false,
    chatHistory: [],
    error: null,
    isChatOpen: false
};

const zhipuaiModelSlice = createSlice({
    name: 'zhipuaiModel',
    initialState,
    reducers: {
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        addToChatHistory: (state, action) => {
            state.chatHistory.push(action.payload);
        },
        setChatHistory: (state, action) => {
            state.chatHistory = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        toggleChat: (state) => {
            state.isChatOpen = !state.isChatOpen;
        },
        clearChatHistory: (state) => {
            state.chatHistory = [];
        }
    }
});

export const { 
    setLoading, 
    addToChatHistory, 
    setChatHistory,
    setError, 
    toggleChat,
    clearChatHistory 
} = zhipuaiModelSlice.actions;

export default zhipuaiModelSlice.reducer;
