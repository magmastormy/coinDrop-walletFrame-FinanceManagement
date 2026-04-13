import { useLogger } from './hooks/useLogger';

import axiosInstance from '../api/userAxios';

class AutoCategorizeService {
    constructor() {
        this.baseURL = '/categories';
        this.transactionPatterns = new Map();
    }

    async initializePatterns() {
        try {
            const response = await axiosInstance.get(`${this.baseURL}/patterns`);
            this.transactionPatterns = new Map(Object.entries(response || {}));
        } catch (error) {
            logError('Failed to initialize categorization patterns:', error);
        }
    }

    async suggestCategory(transaction) {
        try {
            const response = await axiosInstance.post(`${this.baseURL}/suggest`, {
                description: transaction.description,
                amount: transaction.amount,
                merchant: transaction.merchant
            });
            return response;
        } catch (error) {
            logError('Failed to get category suggestion:', error);
            return null;
        }
    }

    async trainModel(transactions) {
        try {
            await axiosInstance.post(`${this.baseURL}/train`, { transactions });
        } catch (error) {
            logError('Failed to train categorization model:', error);
        }
    }

    async batchCategorize(transactions) {
        try {
            const response = await axiosInstance.post(`${this.baseURL}/batch-categorize`, {
                transactions
            });
            return response;
        } catch (error) {
            logError('Failed to batch categorize transactions:', error);
            return [];
        }
    }

    // Local pattern matching for quick categorization
    findMatchingPattern(description) {
        for (const [pattern, category] of this.transactionPatterns) {
            if (description.toLowerCase().includes(pattern.toLowerCase())) {
                return category;
            }
        }
        return null;
    }
}

export default new AutoCategorizeService();
