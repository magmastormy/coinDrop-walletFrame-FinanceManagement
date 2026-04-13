import { useLogger } from '../hooks/useLogger.jsx';

/**
 * Validation utilities for consistent input validation across the application
 */

export const ValidationUtils = {
    /**
     * Validates email format
     */
    validateEmail: (email) => {
        if (!email || typeof email !== 'string') {
            return { isValid: false, error: 'Email is required' };
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email.trim());
        
        return {
            isValid,
            error: isValid ? null : 'Please enter a valid email address'
        };
    },

    /**
     * Validates amount (positive number)
     */
    validateAmount: (amount, allowZero = false) => {
        const numAmount = parseFloat(amount);
        
        if (isNaN(numAmount)) {
            return { isValid: false, error: 'Amount must be a valid number' };
        }
        
        if (numAmount < 0) {
            return { isValid: false, error: 'Amount must be positive' };
        }
        
        if (!allowZero && numAmount === 0) {
            return { isValid: false, error: 'Amount must be greater than 0' };
        }
        
        // Check for reasonable limits (e.g., max 1 billion)
        if (numAmount > 1000000000) {
            return { isValid: false, error: 'Amount exceeds maximum allowed value' };
        }
        
        return { isValid: true, error: null };
    },

    /**
     * Validates currency amount
     */
    validateCurrency: (amount, currency = 'USD') => {
        const numAmount = parseFloat(amount);
        
        if (isNaN(numAmount)) {
            return { isValid: false, error: 'Amount must be a valid number' };
        }
        
        if (numAmount < 0) {
            return { isValid: false, error: 'Amount cannot be negative' };
        }
        
        // Check for reasonable currency limits (e.g., max 1 trillion)
        if (numAmount > 1000000000000) {
            return { isValid: false, error: 'Amount exceeds maximum allowed value' };
        }
        
        return { isValid: true, error: null };
    },

    /**
     * Validates transaction type
     */
    validateTransactionType: (type) => {
        const validTypes = ['income', 'expense', 'transfer', 'deposit', 'withdrawal'];
        return {
            isValid: validTypes.includes(type),
            error: validTypes.includes(type) ? null : `Invalid transaction type. Must be one of: ${validTypes.join(', ')}`
        };
    },

    /**
     * Validates account type
     */
    validateAccountType: (type) => {
        const validTypes = ['wallet', 'savings', 'credit-card', 'investment'];
        return {
            isValid: validTypes.includes(type),
            error: validTypes.includes(type) ? null : `Invalid account type. Must be one of: ${validTypes.join(', ')}`
        };
    },

    /**
     * Validates phone number
     */
    validatePhone: (phone) => {
        if (!phone || typeof phone !== 'string') {
            return { isValid: false, error: 'Phone number is required' };
        }
        
        const phoneRegex = /^\+?[\d\s\-\(\)]{7,}$/;
        const cleanedPhone = phone.replace(/\D/g, '');
        const isValid = phoneRegex.test(cleanedPhone);
        
        return {
            isValid,
            error: isValid ? null : 'Please enter a valid phone number'
        };
    },

    /**
     * Validates URL
     */
    validateUrl: (url) => {
        if (!url || typeof url !== 'string') {
            return { isValid: false, error: 'URL is required' };
        }
        
        try {
            const urlObj = new URL(url);
            return {
                isValid: ['http:', 'https:'].includes(urlObj.protocol),
                error: null
            };
        } catch (error) {
            return { isValid: false, error: 'Please enter a valid URL' };
        }
    },
    validateDate: (dateString, allowFuture = true) => {
        if (!dateString || typeof dateString !== 'string') {
            return { isValid: false, error: 'Date is required' };
        }
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return { isValid: false, error: 'Invalid date format' };
            }
            
            const now = new Date();
            
            if (!allowFuture && date > now) {
                return { isValid: false, error: 'Date cannot be in the future' };
            }
            
            // Check reasonable date range (10 years ago to 1 year in future)
            const minDate = new Date(now.getFullYear() - 10, 0, 1);
            const maxDate = new Date(now.getFullYear() + 1, 11, 31);
            
            if (date < minDate || date > maxDate) {
                return { isValid: false, error: 'Date is outside reasonable range' };
            }
            
            return { isValid: true, error: null };
        } catch (error) {
            return { isValid: false, error: 'Invalid date format' };
        }
    },

    /**
     * Validates ID (string or number)
     */
    validateId: (id, fieldName = 'ID') => {
        if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
            return { isValid: false, error: `Valid ${fieldName} is required` };
        }
        
        if (typeof id === 'string' && id.trim().length === 0) {
            return { isValid: false, error: `${fieldName} cannot be empty` };
        }
        
        return { isValid: true, error: null };
    },

    /**
     * Validates required string field
     */
    validateRequiredString: (value, fieldName, minLength = 1, maxLength = 255) => {
        if (!value || typeof value !== 'string') {
            return { isValid: false, error: `${fieldName} is required` };
        }
        
        const trimmedValue = value.trim();
        
        if (trimmedValue.length < minLength) {
            return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
        }
        
        if (trimmedValue.length > maxLength) {
            return { isValid: false, error: `${fieldName} cannot exceed ${maxLength} characters` };
        }
        
        return { isValid: true, error: null };
    },

    /**
     * Wraps API call with exponential backoff retry logic
     */
    withRetry: async (apiCall, operationName = 'operation', maxRetries = 3, baseDelay = 1000) => {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await apiCall();
            } catch (error) {
                lastError = error;
                
                // Don't retry on validation errors or 4xx status codes
                if (error.name === 'ValidationError' || 
                    (error.response && error.response.status >= 400 && error.response.status < 500)) {
                    throw error;
                }
                
                // Log retry attempt
                logWarn(`${operationName} failed (attempt ${attempt}/${maxRetries}), retrying in ${baseDelay * Math.pow(2, attempt - 1)}ms:`, error.message);
                
                // Wait before retry (exponential backoff)
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
                }
            }
        }
        
        // All retries failed, throw the last error
        throw lastError;
    },

    /**
     * Creates a timeout promise for API calls
     */
    createTimeoutPromise: (timeoutMs = 30000, timeoutMessage = 'Request timed out') => {
        return new Promise((_, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(timeoutMessage));
            }, timeoutMs);
            
            // Store timeout ID for potential cleanup
            (reject.timeoutId = timeoutId);
        });
    },

    /**
     * Wraps API call with timeout protection
     */
    withTimeout: async (apiCall, timeoutMs = 30000) => {
        const timeoutPromise = ValidationUtils.createTimeoutPromise(timeoutMs);
        
        try {
            return await Promise.race([apiCall, timeoutPromise]);
        } catch (error) {
            // Clear timeout if it exists
            if (reject.timeoutId) {
                clearTimeout(reject.timeoutId);
            }
            
            if (error.message === 'Request timed out') {
                throw new Error(`${timeoutMessage.replace('Request timed out', 'Operation')} after ${timeoutMs/1000} seconds`);
            }
            throw error;
        }
    }
};

export default ValidationUtils;
