import axios from 'axios';

class AutoCategorizeService {
    constructor() {
        this.baseURL = '/api/categories';
        this.transactionPatterns = new Map();
    }

    async initializePatterns() {
        try {
            const response = await axios.get(`${this.baseURL}/patterns`);
            this.transactionPatterns = new Map(Object.entries(response.data));
        } catch (error) {
            console.error('Failed to initialize categorization patterns:', error);
        }
    }

    async suggestCategory(transaction) {
        try {
            const response = await axios.post(`${this.baseURL}/suggest`, {
                description: transaction.description,
                amount: transaction.amount,
                merchant: transaction.merchant
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get category suggestion:', error);
            return null;
        }
    }

    async trainModel(transactions) {
        try {
            await axios.post(`${this.baseURL}/train`, { transactions });
        } catch (error) {
            console.error('Failed to train categorization model:', error);
        }
    }

    async batchCategorize(transactions) {
        try {
            const response = await axios.post(`${this.baseURL}/batch-categorize`, {
                transactions
            });
            return response.data;
        } catch (error) {
            console.error('Failed to batch categorize transactions:', error);
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
