import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import walletReducer from './walletSlice';
import budgetReducer from './budgetSlice';
import transactionReducer from './transactionSlice';
import settingsReducer from './settingSlice';
import profileReducer from './profileSlice';
import categoryReducer from './categorySlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        wallet: walletReducer,
        budget: budgetReducer,
        transaction: transactionReducer,
        setting: settingsReducer,
        profile: profileReducer,
        category: categoryReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat((store) => (next) => (action) => {
            console.log('Store.js - Dispatching:', action);
            const result = next(action);
            console.log('Store.js - Next State:', store.getState());
            return result;
        })
});

export default store;
