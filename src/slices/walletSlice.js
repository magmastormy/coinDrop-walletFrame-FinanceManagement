import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    wallets: [],
    loading: false,
    error: null,
    selectedWallet: null,
    stats: null
};

const walletSlice = createSlice({
    name: 'wallet',
    initialState,
    reducers: {
        setWallets: (state, action) =>{
            console.log('Wallet Slice - Setting wallets:', action.payload);
            state.wallets = action.payload;
            state.loading = false;
        },
        setLoading: (state, action) =>{
            state.loading = action.payload;
            if (action.payload === true) {
                state.error = null;
            }
        },
        setError: (state, action) =>{
            state.error = action.payload;
            state.loading = false;
        },
        setSelectedWallet: (state, action) => {
            state.selectedWallet = action.payload;
        },
        addWallet: (state, action) =>{
            state.wallets.push(action.payload);
        },
        updateWallet: (state, action) =>{
            const index = state.wallets.findIndex(w => w._id === action.payload);
            if (index !== -1)
            {
                state.wallets[index] = action.payload;
            }
        },
        deleteWallet: (state, action) =>{
            state.wallets = state.wallets.filter(w =>w._id !== action.payload);
        },
        setWalletStats: (state, action) => {
            state.stats = action.payload;
        }
    }
});

export const {
    setWallets,
    setLoading,
    setError,
    setSelectedWallet,
    addWallet,
    updateWallet,
    deleteWallet,
    setWalletStats
} = walletSlice.actions;

export default walletSlice.reducer;