import { useLogger } from '../hooks/useLogger.jsx';

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import walletService from '../services/walletService';

const isDev = import.meta.env.DEV;

// Add this thunk action
export const fetchWallets = createAsyncThunk(
    'wallet/fetchWallets',
    async (userId, { rejectWithValue }) => {
        try {
            const response = await walletService.getAllWallets(userId);
            return response;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

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
        setWallets: (state, action) => {
            if (isDev) logInfo('Wallet Slice - Setting wallets:', action.payload);
            state.wallets = action.payload;
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
        setSelectedWallet: (state, action) => {
            state.selectedWallet = action.payload;
        },
        addWallet: (state, action) => {
            state.wallets.push(action.payload);
        },
        updateWallet: (state, action) => {
            const index = state.wallets.findIndex(w => w._id === action.payload._id);
            if (index !== -1) {
                state.wallets[index] = action.payload;
            }
        },
        deleteWallet: (state, action) => {
            state.wallets = state.wallets.filter(w => w._id !== action.payload);
        },
        setWalletStats: (state, action) => {
            state.stats = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWallets.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWallets.fulfilled, (state, action) => {
                state.wallets = action.payload;
                state.loading = false;
            })
            .addCase(fetchWallets.rejected, (state, action) => {
                state.error = action.payload;
                state.loading = false;
            });
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

// Memoized Selectors
export const selectAllWallets = (state) => state.wallet.wallets;
export const selectWalletLoading = (state) => state.wallet.loading;
export const selectWalletError = (state) => state.wallet.error;
export const selectSelectedWallet = (state) => state.wallet.selectedWallet;
export const selectWalletStats = (state) => state.wallet.stats;

// Derived selectors
export const selectTotalBalance = (state) =>
    state.wallet.wallets.reduce((total, wallet) => total + (wallet.balance || 0), 0);

export const selectWalletById = (state, walletId) =>
    state.wallet.wallets.find(wallet => wallet._id === walletId);

export const selectActiveWallets = (state) =>
    state.wallet.wallets.filter(wallet => wallet.isActive !== false);

export default walletSlice.reducer;
