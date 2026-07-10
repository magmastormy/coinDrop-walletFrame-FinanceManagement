const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { performance } = require('perf_hooks');

// Models
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Wallet = require('../models/Wallet');
const AuditLog = require('../models/AuditLog');

// Error classes
const {
    ValidationError,
    NotFoundError,
    ConflictError,
    DatabaseError,
    InternalServerError
} = require('../utils/errorClasses');

// Logger
const logger = require('../utils/logger');

/**
 * Helper function to extract metadata from request
 * @param {Object} req - Express request object
 * @returns {Object} Metadata object
 */
const extractMetadata = (req) => ({
    ipAddress: req.ip || req.connection?.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null,
    sessionId: req.sessionID || null,
    requestId: req.requestId || null
});

/**
 * Helper function to build pagination response
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination object
 */
const buildPagination = (total, page, limit) => ({
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
});

const adminController = {
    /**
     * Get dashboard overview
     * Returns key metrics and recent activities
     */
    getDashboardOverview: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;

        try {
            logger.info('Fetching dashboard overview', { adminId });

            // Get total users count
            const totalUsers = await User.countDocuments();

            // Get active users (last login within 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const activeUsers = await User.countDocuments({
                lastLogin: { $gte: thirtyDaysAgo }
            });

            // Get total transactions count
            const totalTransactions = await Transaction.countDocuments();

            // Get total transaction amount using aggregation
            const totalTransactionAmount = await Transaction.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' }
                    }
                }
            ]);

            // Get recent activities (last 5 transactions with user details)
            const recentActivities = await Transaction.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('userId', 'username firstName lastName email')
                .populate('category', 'name color icon')
                .lean();

            // Log VIEW action on SYSTEM entity
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'SYSTEM',
                metadata: extractMetadata(req),
                status: 'SUCCESS'
            });

            const duration = performance.now() - startTime;
            logger.info('Dashboard overview fetched successfully', { adminId, duration: `${duration.toFixed(2)}ms` });

            res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    activeUsers,
                    totalTransactions,
                    totalTransactionAmount: totalTransactionAmount.length > 0 ? totalTransactionAmount[0].total : 0,
                    recentActivities
                },
                message: 'Dashboard overview retrieved successfully'
            });
        } catch (error) {
            logger.error('Error fetching dashboard overview', { adminId, error: error.message });

            // Log failed action
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'SYSTEM',
                metadata: extractMetadata(req),
                status: 'FAILED',
                errorMessage: error.message
            });

            next(new DatabaseError('Failed to fetch dashboard overview', 'aggregation'));
        }
    },

    /**
     * Get dashboard statistics
     * Returns user growth and transaction stats by date
     */
    getDashboardStatistics: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;

        try {
            logger.info('Fetching dashboard statistics', { adminId });

            // Calculate date range (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Get user growth by date
            const userGrowth = await User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Get transaction stats by date (count and amount)
            const transactionStats = await Transaction.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        },
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Log VIEW action on SYSTEM entity
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'SYSTEM',
                metadata: extractMetadata(req),
                status: 'SUCCESS'
            });

            const duration = performance.now() - startTime;
            logger.info('Dashboard statistics fetched successfully', { adminId, duration: `${duration.toFixed(2)}ms` });

            res.status(200).json({
                success: true,
                data: {
                    userGrowth,
                    transactionStats,
                    period: {
                        start: thirtyDaysAgo.toISOString().split('T')[0],
                        end: new Date().toISOString().split('T')[0]
                    }
                },
                message: 'Dashboard statistics retrieved successfully'
            });
        } catch (error) {
            logger.error('Error fetching dashboard statistics', { adminId, error: error.message });

            // Log failed action
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'SYSTEM',
                metadata: extractMetadata(req),
                status: 'FAILED',
                errorMessage: error.message
            });

            next(new DatabaseError('Failed to fetch dashboard statistics', 'aggregation'));
        }
    },

    /**
     * List users with pagination, filtering, and sorting
     */
    listUsers: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;

        try {
            const {
                page = 1,
                limit = 10,
                role,
                isVerified,
                search,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            logger.info('Listing users', { adminId, page, limit, role, isVerified });

            // Build filter object
            const filter = {};

            if (role) {
                filter.role = role;
            }

            if (isVerified !== undefined) {
                filter.isVerified = isVerified === 'true';
            }

            if (search) {
                filter.$or = [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } }
                ];
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute queries in parallel
            const [users, totalUsers] = await Promise.all([
                User.find(filter)
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(parseInt(limit))
                    .select('-password -tokens')
                    .lean(),
                User.countDocuments(filter)
            ]);

            // Log VIEW action on USER entity
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'USER',
                metadata: {
                    ...extractMetadata(req),
                    additionalInfo: { filters: { role, isVerified, search }, pagination: { page, limit } }
                },
                status: 'SUCCESS'
            });

            const duration = performance.now() - startTime;
            logger.info('Users listed successfully', { adminId, count: users.length, duration: `${duration.toFixed(2)}ms` });

            res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination: buildPagination(totalUsers, page, limit)
                },
                message: 'Users retrieved successfully'
            });
        } catch (error) {
            logger.error('Error listing users', { adminId, error: error.message });

            // Log failed action
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'USER',
                metadata: extractMetadata(req),
                status: 'FAILED',
                errorMessage: error.message
            });

            next(new DatabaseError('Failed to list users', 'query'));
        }
    },

    /**
     * Get user details by ID
     */
    getUserDetails: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;
        const { id } = req.params;

        try {
            logger.info('Fetching user details', { adminId, userId: id });

            // Validate user ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ValidationError('Invalid user ID format');
            }

            // Get user with all fields except password
            const user = await User.findById(id)
                .select('-password -tokens')
                .lean();

            if (!user) {
                throw new NotFoundError('User not found', 'USER');
            }

            // Get user's transactions (last 10)
            const transactions = await Transaction.find({ userId: id })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('category', 'name color icon')
                .populate('walletId', 'name type balance')
                .lean();

            // Get user's wallets
            const wallets = await Wallet.find({ userId: id })
                .sort({ createdAt: -1 })
                .lean();

            // Log VIEW action on specific USER entity
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'USER',
                entityId: id,
                metadata: extractMetadata(req),
                status: 'SUCCESS'
            });

            const duration = performance.now() - startTime;
            logger.info('User details fetched successfully', { adminId, userId: id, duration: `${duration.toFixed(2)}ms` });

            res.status(200).json({
                success: true,
                data: {
                    user,
                    transactions,
                    wallets
                },
                message: 'User details retrieved successfully'
            });
        } catch (error) {
            logger.error('Error fetching user details', { adminId, userId: id, error: error.message });

            // Log failed action
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'USER',
                entityId: id,
                metadata: extractMetadata(req),
                status: 'FAILED',
                errorMessage: error.message
            });

            next(error);
        }
    },

    /**
     * Create a new user
     */
    createUser: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;

        try {
            const { username, email, password, firstName, lastName, role, isVerified } = req.body;

            logger.info('Creating new user', { adminId, username, email });

            // Validate required fields
            if (!username || !email || !password || !firstName || !lastName) {
                throw new ValidationError('Missing required fields', [
                    { field: 'username', message: 'Username is required' },
                    { field: 'email', message: 'Email is required' },
                    { field: 'password', message: 'Password is required' },
                    { field: 'firstName', message: 'First name is required' },
                    { field: 'lastName', message: 'Last name is required' }
                ]);
            }

            // Check for duplicate email/username
            const existingUser = await User.findOne({
                $or: [{ username }, { email }]
            });

            if (existingUser) {
                const conflictField = existingUser.username === username ? 'username' : 'email';
                throw new ConflictError(`User with this ${conflictField} already exists`);
            }

            // Hash password using bcrypt
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create new user
            const newUser = new User({
                username,
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: role || 'user',
                isVerified: isVerified || false
            });

            await newUser.save();

            // Prepare user data for audit (without password)
            const userData = newUser.toObject();
            delete userData.password;
            delete userData.tokens;

            // Log CREATE action with changes
            await AuditLog.logAction({
                adminId,
                action: 'CREATE',
                entityType: 'USER',
                entityId: newUser._id,
                changes: {
                    before: null,
                    after: userData
                },
                metadata: extractMetadata(req),
                status: 'SUCCESS'
            });

            const duration = performance.now() - startTime;
            logger.info('User created successfully', { adminId, userId: newUser._id, duration: `${duration.toFixed(2)}ms` });

            res.status(201).json({
                success: true,
                data: userData,
                message: 'User created successfully'
            });
        } catch (error) {
            logger.error('Error creating user', { adminId, error: error.message });

            // Log failed action
            await AuditLog.logAction({
                adminId,
                action: 'CREATE',
                entityType: 'USER',
                metadata: extractMetadata(req),
                status: 'FAILED',
                errorMessage: error.message
            });

            next(error);
        }
    },

    /**
     * Update user by ID
     */
    updateUser: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;
        const { id } = req.params;

        try {
            logger.info('Updating user', { adminId, userId: id });

            // Validate user ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ValidationError('Invalid user ID format');
            }

            // Get user and store original data for audit
            const user = await User.findById(id);

            if (!user) {
                throw new NotFoundError('User not found', 'USER');
            }

            // Store original data (without sensitive fields)
            const originalData = user.toObject();
            delete originalData.password;
            delete originalData.tokens;

            const updates = req.body;

            // Prevent updating password through this endpoint
            if (updates.password) {
                delete updates.password;
            }

            // Apply updates
            Object.keys(updates).forEach(key => {
                if (key !== '_id' && key !== 'createdAt') {
                    user[key] = updates[key];
                }
            });

            await user.save();

            // Prepare updated data (without sensitive fields)
            const updatedData = user.toObject();
            delete updatedData.password;
            delete updatedData.tokens;

            // Log UPDATE action with changes
            await AuditLog.logAction({
                adminId,
                action: 'UPDATE',
                entityType: 'USER',
                entityId: id,
                changes: {
                    before: originalData,
                    after: updatedData
                },
                metadata: extractMetadata(req),
                status: 'SUCCESS'
            });

            const duration = performance.now() - startTime;
            logger.info('User updated successfully', { adminId, userId: id, duration: `${duration.toFixed(2)}ms` });

            res.status(200).json({
                success: true,
                data: updatedData,
                message: 'User updated successfully'
            });
        } catch (error) {
            logger.error('Error updating user', { adminId, userId: id, error: error.message });

            // Log failed action
            await AuditLog.logAction({
                adminId,
                action: 'UPDATE',
                entityType: 'USER',
                entityId: id,
                metadata: extractMetadata(req),
                status: 'FAILED',
                errorMessage: error.message
            });

            next(error);
        }
    },

    /**
     * Delete user by ID (soft delete)
     */
    deleteUser: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;
        const { id } = req.params;

        try {
            logger.info('Deleting user', { adminId, userId: id });

            // Validate user ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ValidationError('Invalid user ID format');
            }

            // Get user before deletion for audit
            const user = await User.findById(id);

            if (!user) {
                throw new NotFoundError('User not found', 'USER');
            }

            // Store user data for audit (without sensitive fields)
            const userData = user.toObject();
            delete userData.password;
            delete userData.tokens;

            // Soft delete - update user to mark as deleted
            user.isDeleted = true;
            user.deletedAt = new Date();
            user.deletedBy = adminId;
            await user.save();

            // Alternatively, for hard delete with cascade:
            // await Transaction.deleteMany({ userId: id });
            // await Wallet.deleteMany({ userId: id });
            // await User.findByIdAndDelete(id);

            // Log DELETE action
            await AuditLog.logAction({
                adminId,
                action: 'DELETE',
                entityType: 'USER',
                entityId: id,
                changes: {
                    before: userData,
                    after: { isDeleted: true, deletedAt: new Date(), deletedBy: adminId }
                },
                metadata: extractMetadata(req),
                status: 'SUCCESS'
            });

            const duration = performance.now() - startTime;
            logger.info('User deleted successfully', { adminId, userId: id, duration: `${duration.toFixed(2)}ms` });

            res.status(200).json({
                success: true,
                data: { userId: id, deletedAt: new Date() },
                message: 'User deleted successfully'
            });
        } catch (error) {
            logger.error('Error deleting user', { adminId, userId: id, error: error.message });

            // Log failed action
            await AuditLog.logAction({
                adminId,
                action: 'DELETE',
                entityType: 'USER',
                entityId: id,
                metadata: extractMetadata(req),
                status: 'FAILED',
                errorMessage: error.message
            });

            next(error);
        }
    },

    /**
     * List transactions with pagination and filtering
     */
    listTransactions: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;

        try {
            const {
                page = 1,
                limit = 10,
                type,
                userId,
                startDate,
                endDate,
                category,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            logger.info('Listing transactions', { adminId, page, limit, type, userId });

            // Build filter object
            const filter = {};

            if (type) {
                filter.type = type;
            }

            if (userId) {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    throw new ValidationError('Invalid user ID format');
                }
                filter.userId = userId;
            }

            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) {
                    filter.createdAt.$gte = new Date(startDate);
                }
                if (endDate) {
                    filter.createdAt.$lte = new Date(endDate);
                }
            }

            if (category) {
                if (!mongoose.Types.ObjectId.isValid(category)) {
                    throw new ValidationError('Invalid category ID format');
                }
                filter.category = category;
            }

            // Build sort object
            const sort = {};
            sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

            // Execute queries in parallel
            const [transactions, totalTransactions] = await Promise.all([
                Transaction.find(filter)
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(parseInt(limit))
                    .populate('userId', 'username email firstName lastName')
                    .populate('category', 'name color icon')
                    .populate('walletId', 'name type')
                    .lean(),
                Transaction.countDocuments(filter)
            ]);

            // Log VIEW action on TRANSACTION entity
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'TRANSACTION',
                metadata: {
                    ...extractMetadata(req),
                    additionalInfo: { filters: { type, userId, startDate, endDate, category }, pagination: { page, limit } }
                },
                status: 'SUCCESS'
            });

            const duration = performance.now() - startTime;
            logger.info('Transactions listed successfully', { adminId, count: transactions.length, duration: `${duration.toFixed(2)}ms` });

            res.status(200).json({
                success: true,
                data: {
                    transactions,
                    pagination: buildPagination(totalTransactions, page, limit)
                },
                message: 'Transactions retrieved successfully'
            });
        } catch (error) {
            logger.error('Error listing transactions', { adminId, error: error.message });

            // Log failed action
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'TRANSACTION',
                metadata: extractMetadata(req),
                status: 'FAILED',
                errorMessage: error.message
            });

            next(error);
        }
    },

    /**
     * Get transaction details by ID
     */
    getTransactionDetails: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;
        const { id } = req.params;

        try {
            logger.info('Fetching transaction details', { adminId, transactionId: id });

            // Validate transaction ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new ValidationError('Invalid transaction ID format');
            }

            // Get transaction with populated details
            const transaction = await Transaction.findById(id)
                .populate('userId', 'username email firstName lastName')
                .populate('category', 'name color icon')
                .populate('subcategory', 'name color icon')
                .populate('walletId', 'name type balance currency')
                .populate('fromWalletId', 'name type')
                .populate('toWalletId', 'name type')
                .lean();

            if (!transaction) {
                throw new NotFoundError('Transaction not found', 'TRANSACTION');
            }

            // Log VIEW action on specific TRANSACTION entity
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'TRANSACTION',
                entityId: id,
                metadata: extractMetadata(req),
                status: 'SUCCESS'
            });

            const duration = performance.now() - startTime;
            logger.info('Transaction details fetched successfully', { adminId, transactionId: id, duration: `${duration.toFixed(2)}ms` });

            res.status(200).json({
                success: true,
                data: transaction,
                message: 'Transaction details retrieved successfully'
            });
        } catch (error) {
            logger.error('Error fetching transaction details', { adminId, transactionId: id, error: error.message });

            // Log failed action
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'TRANSACTION',
                entityId: id,
                metadata: extractMetadata(req),
                status: 'FAILED',
                errorMessage: error.message
            });

            next(error);
        }
    },

    /**
     * Get transaction statistics
     */
    getTransactionStatistics: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;

        try {
            const { startDate, endDate, userId } = req.query;

            logger.info('Fetching transaction statistics', { adminId, startDate, endDate, userId });

            // Build filter for date range
            const filter = {};

            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) {
                    filter.createdAt.$gte = new Date(startDate);
                }
                if (endDate) {
                    filter.createdAt.$lte = new Date(endDate);
                }
            }

            if (userId) {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    throw new ValidationError('Invalid user ID format');
                }
                filter.userId = userId;
            }

            // Aggregate by type (income/expense)
            const typeStats = await Transaction.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Aggregate by category
            const categoryStats = await Transaction.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                },
                { $sort: { totalAmount: -1 } },
                { $limit: 10 }
            ]);

            // Populate category details
            const categoryIds = categoryStats.map(stat => stat._id).filter(id => id);
            const categories = await Category.find({ _id: { $in: categoryIds } })
                .select('name color icon')
                .lean();

            const categoryMap = categories.reduce((map, cat) => {
                map[cat._id.toString()] = cat;
                return map;
            }, {});

            const categoryBreakdown = categoryStats.map(stat => ({
                category: stat._id ? categoryMap[stat._id.toString()] || { name: 'Unknown' } : { name: 'Uncategorized' },
                count: stat.count,
                totalAmount: stat.totalAmount
            }));

            // Aggregate by date
            const dateStats = await Transaction.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$createdAt'
                            }
                        },
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Calculate totals
            const totals = typeStats.reduce((acc, stat) => {
                acc[stat._id] = {
                    count: stat.count,
                    totalAmount: stat.totalAmount
                };
                return acc;
            }, {});

            // Log VIEW action on SYSTEM entity
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'SYSTEM',
                metadata: {
                    ...extractMetadata(req),
                    additionalInfo: { dateRange: { startDate, endDate }, userId }
                },
                status: 'SUCCESS'
            });

            const duration = performance.now() - startTime;
            logger.info('Transaction statistics fetched successfully', { adminId, duration: `${duration.toFixed(2)}ms` });

            res.status(200).json({
                success: true,
                data: {
                    totals,
                    categoryBreakdown,
                    dateStats,
                    period: {
                        start: startDate || 'All time',
                        end: endDate || 'Present'
                    }
                },
                message: 'Transaction statistics retrieved successfully'
            });
        } catch (error) {
            logger.error('Error fetching transaction statistics', { adminId, error: error.message });

            // Log failed action
            await AuditLog.logAction({
                adminId,
                action: 'VIEW',
                entityType: 'SYSTEM',
                metadata: extractMetadata(req),
                status: 'FAILED',
                errorMessage: error.message
            });

            next(error);
        }
    },

    /**
     * Get system health status
     */
    getSystemHealth: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;

        try {
            logger.info('Checking system health', { adminId });

            // Check database connection
            const dbState = mongoose.connection.readyState;
            const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : dbState === 3 ? 'disconnecting' : 'disconnected';
            const isDbHealthy = dbState === 1;

            // Check memory usage
            const memoryUsage = process.memoryUsage();
            const memoryStatus = {
                rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                external: Math.round(memoryUsage.external / 1024 / 1024), // MB
                usagePercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
            };
            const isMemoryHealthy = memoryStatus.usagePercent < 90;

            // Check uptime
            const uptime = process.uptime();
            const uptimeFormatted = {
                seconds: Math.floor(uptime),
                formatted: `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
            };

            // Overall health status
            const overallStatus = isDbHealthy && isMemoryHealthy ? 'healthy' : 'degraded';

            const duration = performance.now() - startTime;
            logger.info('System health check completed', { adminId, status: overallStatus, duration: `${duration.toFixed(2)}ms` });

            res.status(200).json({
                success: true,
                data: {
                    status: overallStatus,
                    timestamp: new Date().toISOString(),
                    database: {
                        status: dbStatus,
                        healthy: isDbHealthy
                    },
                    memory: {
                        ...memoryStatus,
                        healthy: isMemoryHealthy
                    },
                    uptime: uptimeFormatted,
                    environment: process.env.NODE_ENV || 'development',
                    version: process.env.npm_package_version || '1.0.0'
                },
                message: 'System health retrieved successfully'
            });
        } catch (error) {
            logger.error('Error checking system health', { adminId, error: error.message });
            next(new InternalServerError('Failed to check system health'));
        }
    },

    /**
     * Get system metrics
     */
    getSystemMetrics: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;

        try {
            logger.info('Fetching system metrics', { adminId });

            // Calculate response time
            const responseTime = performance.now() - startTime;

            // Get request counts (if using metrics collector)
            const requestCount = global.requestCount || 0;
            const errorCount = global.errorCount || 0;
            const errorRate = requestCount > 0 ? ((errorCount / requestCount) * 100).toFixed(2) : 0;

            // CPU usage
            const cpuUsage = process.cpuUsage();
            const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2);

            // Active connections (if available)
            const activeConnections = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

            const duration = performance.now() - startTime;
            logger.info('System metrics fetched successfully', { adminId, duration: `${duration.toFixed(2)}ms` });

            res.status(200).json({
                success: true,
                data: {
                    performance: {
                        responseTime: `${responseTime.toFixed(2)}ms`,
                        cpuUsage: `${cpuPercent}%`
                    },
                    requests: {
                        total: requestCount,
                        errors: errorCount,
                        errorRate: `${errorRate}%`
                    },
                    connections: {
                        database: activeConnections
                    },
                    system: {
                        nodeVersion: process.version,
                        platform: process.platform,
                        arch: process.arch,
                        pid: process.pid
                    },
                    timestamp: new Date().toISOString()
                },
                message: 'System metrics retrieved successfully'
            });
        } catch (error) {
            logger.error('Error fetching system metrics', { adminId, error: error.message });
            next(new InternalServerError('Failed to fetch system metrics'));
        }
    },

    /**
     * Get summary report
     */
    getSummaryReport: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;

        try {
            const { startDate, endDate } = req.query;

            logger.info('Generating summary report', { adminId, startDate, endDate });

            // Build date filter
            const filter = {};
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate);
                if (endDate) filter.createdAt.$lte = new Date(endDate);
            }

            // Get user statistics
            const userStats = await User.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        verified: {
                            $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
                        }
                    }
                }
            ]);

            // Get transaction statistics
            const transactionStats = await Transaction.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ]);

            // Log EXPORT action
            await AuditLog.logAction({
                adminId,
                action: 'EXPORT',
                entityType: 'SYSTEM',
                metadata: {
                    ...extractMetadata(req),
                    additionalInfo: { reportType: 'summary', dateRange: { startDate, endDate } }
                },
                status: 'SUCCESS'
            });

            const duration = performance.now() - startTime;
            logger.info('Summary report generated successfully', { adminId, duration: `${duration.toFixed(2)}ms` });

            res.status(200).json({
                success: true,
                data: {
                    userCount: userStats.length > 0 ? userStats[0].total : 0,
                    verifiedUsers: userStats.length > 0 ? userStats[0].verified : 0,
                    transactionCount: transactionStats.length > 0 ? transactionStats[0].total : 0,
                    totalTransactionAmount: transactionStats.length > 0 ? transactionStats[0].totalAmount : 0,
                    period: {
                        start: startDate || 'All time',
                        end: endDate || 'Present'
                    },
                    generatedAt: new Date().toISOString()
                },
                message: 'Summary report generated successfully'
            });
        } catch (error) {
            logger.error('Error generating summary report', { adminId, error: error.message });

            // Log failed action
            await AuditLog.logAction({
                adminId,
                action: 'EXPORT',
                entityType: 'SYSTEM',
                metadata: extractMetadata(req),
                status: 'FAILED',
                errorMessage: error.message
            });

            next(new DatabaseError('Failed to generate summary report', 'aggregation'));
        }
    },

    /**
     * Get detailed report
     */
    getDetailedReport: async (req, res, next) => {
        const startTime = performance.now();
        const adminId = req.user?.userId || req.authUserId;

        try {
            const { startDate, endDate } = req.query;

            logger.info('Generating detailed report', { adminId, startDate, endDate });

            // Build date filter
            const filter = {};
            if (startDate || endDate) {
                filter.createdAt = {};
                if (startDate) filter.createdAt.$gte = new Date(startDate);
                if (endDate) filter.createdAt.$lte = new Date(endDate);
            }

            // Get user growth
            const userGrowth = await User.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Get transaction trends
            const transactionTrends = await Transaction.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            // Get top users by transaction count
            const topUsers = await Transaction.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: '$userId',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: 0,
                        userId: '$_id',
                        username: '$user.username',
                        email: '$user.email',
                        count: 1,
                        totalAmount: 1
                    }
                }
            ]);

            // Log EXPORT action
            await AuditLog.logAction({
                adminId,
                action: 'EXPORT',
                entityType: 'SYSTEM',
                metadata: {
                    ...extractMetadata(req),
                    additionalInfo: { reportType: 'detailed', dateRange: { startDate, endDate } }
                },
                status: 'SUCCESS'
            });

            const duration = performance.now() - startTime;
            logger.info('Detailed report generated successfully', { adminId, duration: `${duration.toFixed(2)}ms` });

            res.status(200).json({
                success: true,
                data: {
                    userGrowth,
                    transactionTrends,
                    topUsers,
                    period: {
                        start: startDate || 'All time',
                        end: endDate || 'Present'
                    },
                    generatedAt: new Date().toISOString()
                },
                message: 'Detailed report generated successfully'
            });
        } catch (error) {
            logger.error('Error generating detailed report', { adminId, error: error.message });

            // Log failed action
            await AuditLog.logAction({
                adminId,
                action: 'EXPORT',
                entityType: 'SYSTEM',
                metadata: extractMetadata(req),
                status: 'FAILED',
                errorMessage: error.message
            });

            next(new DatabaseError('Failed to generate detailed report', 'aggregation'));
        }
    }
};

module.exports = adminController;
