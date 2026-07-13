/**
 * Field Filtering Middleware
 * Prevents mass assignment / NoSQL injection by stripping unknown fields
 * from req.body, req.query, and req.params
 */

// Define allowed fields for each endpoint type
const ALLOWED_FIELDS = {
  // Transaction fields
  transaction: {
    create: ['amount', 'type', 'category', 'description', 'walletId', 'savingsAccountId', 'date'],
    update: ['amount', 'type', 'category', 'description', 'walletId', 'savingsAccountId', 'date'],
    query: ['page', 'limit', 'type', 'category', 'walletId', 'startDate', 'endDate', 'minAmount', 'maxAmount', 'sortBy', 'sortOrder', 'search']
  },
  // Category fields
  category: {
    create: ['name', 'type', 'color', 'icon', 'description', 'parentId'],
    update: ['name', 'type', 'color', 'icon', 'description', 'parentId'],
    query: ['page', 'limit', 'type', 'isActive', 'search', 'sortBy', 'sortOrder']
  },
  // Wallet fields
  wallet: {
    create: ['name', 'type', 'balance', 'currency', 'isDefault'],
    update: ['name', 'type', 'balance', 'currency', 'isDefault'],
    query: ['page', 'limit', 'type', 'search', 'sortBy', 'sortOrder']
  },
  // Budget fields
  budget: {
    create: ['name', 'amount', 'period', 'categories', 'startDate', 'endDate', 'isActive'],
    update: ['name', 'amount', 'period', 'categories', 'startDate', 'endDate', 'isActive'],
    query: ['page', 'limit', 'isActive', 'search', 'sortBy', 'sortOrder']
  },
  // Savings Account fields
  savingsAccount: {
    create: ['name', 'balance', 'currency', 'interestRate', 'targetAmount', 'targetDate'],
    update: ['name', 'balance', 'currency', 'interestRate', 'targetAmount', 'targetDate'],
    query: ['page', 'limit', 'search', 'sortBy', 'sortOrder']
  },
  // Savings Goal fields
  savingsGoal: {
    create: ['name', 'targetAmount', 'currentAmount', 'targetDate', 'category', 'color', 'icon'],
    update: ['name', 'targetAmount', 'currentAmount', 'targetDate', 'category', 'color', 'icon'],
    query: ['page', 'limit', 'search', 'sortBy', 'sortOrder']
  },
  // User profile fields
  userProfile: {
    update: ['firstName', 'lastName', 'username', 'email', 'profilePicture', 'currency', 'language', 'timezone', 'dateFormat'],
    query: []
  },
  // Admin user fields
  adminUser: {
    create: ['username', 'email', 'password', 'firstName', 'lastName', 'role', 'isVerified'],
    update: ['username', 'email', 'firstName', 'lastName', 'role', 'isVerified', 'profilePicture'],
    query: ['page', 'limit', 'role', 'isVerified', 'search', 'sortBy', 'sortOrder']
  },
  // Report fields
  report: {
    create: ['type', 'format', 'startDate', 'endDate'],
    query: ['page', 'limit', 'type', 'status', 'startDate', 'endDate', 'sortBy', 'sortOrder']
  }
};

/**
 * Creates a middleware that filters fields based on allowed list
 * @param {string} resourceType - The resource type (e.g., 'transaction', 'category')
 * @param {string} operation - The operation type ('create', 'update', 'query')
 * @param {Object} options - Additional options
 * @param {boolean} options.allowUnknown - If true, logs warning but doesn't strip (for debugging)
 * @returns {Function} Express middleware
 */
function createFieldFilter(resourceType, operation, options = {}) {
  const { allowUnknown = false } = options;
  const allowedFields = ALLOWED_FIELDS[resourceType]?.[operation] || [];
  
  return (req, res, next) => {
    // Filter req.body
    if (req.body && typeof req.body === 'object') {
      const filteredBody = {};
      const unknownFields = [];
      
      for (const [key, value] of Object.entries(req.body)) {
        if (allowedFields.includes(key)) {
          filteredBody[key] = value;
        } else {
          unknownFields.push(key);
        }
      }
      
      if (unknownFields.length > 0) {
        const msg = `Filtered out unknown fields in ${resourceType}.${operation}: ${unknownFields.join(', ')}`;
        if (allowUnknown) {
          console.warn(msg);
        } else {
          console.warn(`[SECURITY] ${msg}`);
        }
      }
      
      req.body = filteredBody;
    }
    
    // Filter req.query
    if (req.query && typeof req.query === 'object') {
      const filteredQuery = {};
      const unknownFields = [];
      
      for (const [key, value] of Object.entries(req.query)) {
        if (allowedFields.includes(key)) {
          filteredQuery[key] = value;
        } else {
          unknownFields.push(key);
        }
      }
      
      if (unknownFields.length > 0) {
        const msg = `Filtered out unknown query params in ${resourceType}.${operation}: ${unknownFields.join(', ')}`;
        if (allowUnknown) {
          console.warn(msg);
        } else {
          console.warn(`[SECURITY] ${msg}`);
        }
      }
      
      req.query = filteredQuery;
    }
    
    // Note: We don't filter req.params as those are route parameters
    
    next();
  };
}

// Pre-configured middlewares for common operations
const fieldFilters = {
  // Transactions
  transactionCreate: createFieldFilter('transaction', 'create'),
  transactionUpdate: createFieldFilter('transaction', 'update'),
  transactionQuery: createFieldFilter('transaction', 'query'),
  
  // Categories
  categoryCreate: createFieldFilter('category', 'create'),
  categoryUpdate: createFieldFilter('category', 'update'),
  categoryQuery: createFieldFilter('category', 'query'),
  
  // Wallets
  walletCreate: createFieldFilter('wallet', 'create'),
  walletUpdate: createFieldFilter('wallet', 'update'),
  walletQuery: createFieldFilter('wallet', 'query'),
  
  // Budgets
  budgetCreate: createFieldFilter('budget', 'create'),
  budgetUpdate: createFieldFilter('budget', 'update'),
  budgetQuery: createFieldFilter('budget', 'query'),
  
  // Savings Accounts
  savingsAccountCreate: createFieldFilter('savingsAccount', 'create'),
  savingsAccountUpdate: createFieldFilter('savingsAccount', 'update'),
  savingsAccountQuery: createFieldFilter('savingsAccount', 'query'),
  
  // Savings Goals
  savingsGoalCreate: createFieldFilter('savingsGoal', 'create'),
  savingsGoalUpdate: createFieldFilter('savingsGoal', 'update'),
  savingsGoalQuery: createFieldFilter('savingsGoal', 'query'),
  
  // User Profile
  userProfileUpdate: createFieldFilter('userProfile', 'update'),
  userProfileQuery: createFieldFilter('userProfile', 'query'),
  
  // Admin Users
  adminUserCreate: createFieldFilter('adminUser', 'create'),
  adminUserUpdate: createFieldFilter('adminUser', 'update'),
  adminUserQuery: createFieldFilter('adminUser', 'query'),
  
  // Reports
  reportCreate: createFieldFilter('report', 'create'),
  reportQuery: createFieldFilter('report', 'query')
};

/**
 * Helper to add custom allowed fields dynamically
 * @param {string} resourceType 
 * @param {string} operation 
 * @param {string[]} additionalFields 
 */
function addAllowedFields(resourceType, operation, additionalFields) {
  if (!ALLOWED_FIELDS[resourceType]) {
    ALLOWED_FIELDS[resourceType] = { create: [], update: [], query: [] };
  }
  if (!ALLOWED_FIELDS[resourceType][operation]) {
    ALLOWED_FIELDS[resourceType][operation] = [];
  }
  ALLOWED_FIELDS[resourceType][operation].push(...additionalFields);
}

module.exports = {
  createFieldFilter,
  fieldFilters,
  addAllowedFields,
  ALLOWED_FIELDS
};