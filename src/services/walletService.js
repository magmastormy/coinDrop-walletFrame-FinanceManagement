import { useLogger } from '../hooks/useLogger.jsx';

import axiosInstance from '../api/userAxios';
import { makeRequest } from './apiRequestManager';
import ValidationUtils from '../utils/validationUtils';

const API_URL = '/wallets';

const walletService = {
    getAllWallets: async () => {
        return makeRequest('wallets', async () => {
            const response = await axiosInstance.get(API_URL);
            return response.data?.wallets || [];
        });
    },

    getWalletBudgets: async walletId => {
        try {
            const response = await axiosInstance.get(`${API_URL}/${walletId}/budgets`);
            return response.data?.budgets || [];
        } catch (error) {
            logError('Error fetching wallet budgets:', error);
            throw error;
        }
    },

    createWallet: async walletData => {
        return ValidationUtils.withRetry(async () => {
            // Input validation
            if (!walletData || typeof walletData !== 'object') {
                throw new Error('Wallet data must be a valid object');
            }
            
            if (!walletData.name || typeof walletData.name !== 'string' || walletData.name.trim().length === 0) {
                throw new Error('Wallet name is required and must be a non-empty string');
            }
            
            if (walletData.balance && (isNaN(parseFloat(walletData.balance)) || parseFloat(walletData.balance) < 0)) {
                throw new Error('Wallet balance must be a valid non-negative number');
            }

            const response = await axiosInstance.post(API_URL, walletData);
            return response.data;
        }, 'createWallet');
    },

    updateWallet: async (id, walletData) => {
        return ValidationUtils.withRetry(async () => {
            // Input validation
            if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
                throw new Error('Valid wallet ID is required');
            }
            
            if (!walletData || typeof walletData !== 'object') {
                throw new Error('Wallet data must be a valid object');
            }

            const response = await axiosInstance.put(`${API_URL}/${id}`, walletData);
            return response.data;
        }, 'updateWallet');
    },

    deleteWallet: async (id, transferToWalletId = null) => {
        // Input validation
        if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
            throw new Error('Valid wallet ID is required');
        }

        try {
            const config = transferToWalletId ? { data: { transferToWalletId } } : {};
            const response = await axiosInstance.delete(`${API_URL}/${id}`, config);
            return response;
        } catch (error) {
            logError('Delete wallet failed:', error);
            throw error;
        }
    },

    getWalletStats: async () => {
        const response = await axiosInstance.get(`${API_URL}/stats`);
        return response.data?.stats || [];
    },

    transferBetweenWallets: async (fromWalletId, toWalletId, amount) => {
        // Input validation
        if (!fromWalletId || (typeof fromWalletId !== 'string' && typeof fromWalletId !== 'number')) {
            throw new Error('Valid source wallet ID is required');
        }
        
        if (!toWalletId || (typeof toWalletId !== 'string' && typeof toWalletId !== 'number')) {
            throw new Error('Valid destination wallet ID is required');
        }
        
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error('Transfer amount must be a positive number');
        }

        if (fromWalletId === toWalletId) {
            throw new Error('Source and destination wallets must be different');
        }

        try {
            // Add timeout protection
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Transfer request timed out')), 30000
            ));

            const response = await Promise.race([
                axiosInstance.post(`${API_URL}/transfer`, {
                    fromWalletId,
                    toWalletId,
                    amount: numAmount
                }),
                timeoutPromise
            ]);
            
            return response.data;
        } catch (error) {
            logError('Transfer between wallets failed:', error);
            throw error;
        }
    },
};

export default walletService;
