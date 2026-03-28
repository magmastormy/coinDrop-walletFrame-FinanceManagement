const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');
const { performance } = require('perf_hooks');

const adminController = {
    // Dashboard overview
    getDashboardOverview: async (req, res, next) => {
        try {
            // Get total users
            const totalUsers = await User.countDocuments();
            
            // Get active users (last login within 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const activeUsers = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });
            
            // Get total transactions
            const totalTransactions = await Transaction.countDocuments();
            
            // Get total transaction amount
            const totalTransactionAmount = await Transaction.aggregate([
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            
            // Get recent activities (last 24 hours)
            const recentActivities = await Transaction.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('userId', 'username firstName lastName');
            
            res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    activeUsers,
                    totalTransactions,
                    totalTransactionAmount: totalTransactionAmount.length > 0 ? totalTransactionAmount[0].total : 0,
                    recentActivities
                }
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    },
    
    // Dashboard statistics
    getDashboardStatistics: async (req, res, next) => {
        try {
            // Get user growth over time (last 30 days)
            const userGrowth = await User.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
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
                {
                    $sort: { _id: 1 }
                }
            ]);
            
            // Get transaction statistics
            const transactionStats = await Transaction.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        }
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
                {
                    $sort: { _id: 1 }
                }
            ]);
            
            res.status(200).json({
                success: true,
                data: {
                    userGrowth,
                    transactionStats
                }
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    },
    
    // User management
    listUsers: async (req, res, next) => {
        try {
            const { page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;
            
            const users = await User.find()
                .sort({ [sort]: order === 'asc' ? 1 : -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .select('-password -tokens');
            
            const totalUsers = await User.countDocuments();
            
            res.status(200).json({
                success: true,
                data: {
                    users,
                    pagination: {
                        total: totalUsers,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(totalUsers / limit)
                    }
                }
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    },
    
    getUserDetails: async (req, res, next) => {
        try {
            const { id } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                const error = new Error('Invalid user ID');
                error.status = 400;
                return next(error);
            }
            
            const user = await User.findById(id).select('-password -tokens');
            
            if (!user) {
                const error = new Error('User not found');
                error.status = 404;
                return next(error);
            }
            
            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    },
    
    createUser: async (req, res, next) => {
        try {
            const { username, email, password, firstName, lastName, role } = req.body;
            
            // Check if user already exists
            const existingUser = await User.findOne({ $or: [{ username }, { email }] });
            if (existingUser) {
                const error = new Error('User with this username or email already exists');
                error.status = 400;
                return next(error);
            }
            
            // Create new user
            const newUser = new User({
                username,
                email,
                password,
                firstName,
                lastName,
                role: role || 'user'
            });
            
            await newUser.save();
            
            res.status(201).json({
                success: true,
                data: newUser.toPublicProfile()
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    },
    
    updateUser: async (req, res, next) => {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                const error = new Error('Invalid user ID');
                error.status = 400;
                return next(error);
            }
            
            // Exclude password from updates if not provided
            if (!updates.password) {
                delete updates.password;
            }
            
            const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
            
            if (!user) {
                const error = new Error('User not found');
                error.status = 404;
                return next(error);
            }
            
            res.status(200).json({
                success: true,
                data: user.toPublicProfile()
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    },
    
    deleteUser: async (req, res, next) => {
        try {
            const { id } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                const error = new Error('Invalid user ID');
                error.status = 400;
                return next(error);
            }
            
            const user = await User.findByIdAndDelete(id);
            
            if (!user) {
                const error = new Error('User not found');
                error.status = 404;
                return next(error);
            }
            
            res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    },
    
    // Transaction management
    listTransactions: async (req, res, next) => {
        try {
            const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', userId } = req.query;
            
            const filter = {};
            if (userId) {
                filter.userId = userId;
            }
            
            const transactions = await Transaction.find(filter)
                .sort({ [sort]: order === 'asc' ? 1 : -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .populate('userId', 'username firstName lastName')
                .populate('categoryId', 'name');
            
            const totalTransactions = await Transaction.countDocuments(filter);
            
            res.status(200).json({
                success: true,
                data: {
                    transactions,
                    pagination: {
                        total: totalTransactions,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(totalTransactions / limit)
                    }
                }
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    },
    
    getTransactionDetails: async (req, res, next) => {
        try {
            const { id } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                const error = new Error('Invalid transaction ID');
                error.status = 400;
                return next(error);
            }
            
            const transaction = await Transaction.findById(id)
                .populate('userId', 'username firstName lastName')
                .populate('categoryId', 'name');
            
            if (!transaction) {
                const error = new Error('Transaction not found');
                error.status = 404;
                return next(error);
            }
            
            res.status(200).json({
                success: true,
                data: transaction
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    },
    
    getTransactionStatistics: async (req, res, next) => {
        try {
            const { startDate, endDate, category } = req.query;
            
            const filter = {};
            
            if (startDate) {
                filter.createdAt = { ...filter.createdAt, $gte: new Date(startDate) };
            }
            
            if (endDate) {
                filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
            }
            
            if (category) {
                filter.categoryId = category;
            }
            
            // Get total transaction amount
            const totalAmount = await Transaction.aggregate([
                { $match: filter },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            
            // Get transactions by category
            const byCategory = await Transaction.aggregate([
                { $match: filter },
                { $group: { _id: '$categoryId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
                { $sort: { total: -1 } }
            ]);
            
            // Get transactions by day
            const byDay = await Transaction.aggregate([
                { $match: filter },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]);
            
            res.status(200).json({
                success: true,
                data: {
                    totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
                    byCategory,
                    byDay
                }
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    },
    
    // System routes
    getSystemHealth: async (req, res, next) => {
        try {
            // Check database connection
            const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
            
            // Check memory usage
            const memoryUsage = process.memoryUsage();
            
            // Check uptime
            const uptime = process.uptime();
            
            res.status(200).json({
                success: true,
                data: {
                    dbStatus,
                    memoryUsage: {
                        rss: memoryUsage.rss,
                        heapTotal: memoryUsage.heapTotal,
                        heapUsed: memoryUsage.heapUsed,
                        external: memoryUsage.external
                    },
                    uptime,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    },
    
    getSystemMetrics: async (req, res, next) => {
        try {
            // Get request duration
            const start = performance.now();
            
            // Simulate some work
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const end = performance.now();
            const requestDuration = end - start;
            
            res.status(200).json({
                success: true,
                data: {
                    requestDuration,
                    nodeVersion: process.version,
                    platform: process.platform,
                    arch: process.arch,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    },
    
    // Report routes
    getSummaryReport: async (req, res, next) => {
        try {
            const { startDate, endDate } = req.query;
            
            const filter = {};
            
            if (startDate) {
                filter.createdAt = { ...filter.createdAt, $gte: new Date(startDate) };
            }
            
            if (endDate) {
                filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
            }
            
            // Get user statistics
            const userStats = await User.aggregate([
                { $match: filter },
                { $group: { _id: null, total: { $sum: 1 } } }
            ]);
            
            // Get transaction statistics
            const transactionStats = await Transaction.aggregate([
                { $match: filter },
                { $group: { _id: null, total: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
            ]);
            
            res.status(200).json({
                success: true,
                data: {
                    userCount: userStats.length > 0 ? userStats[0].total : 0,
                    transactionCount: transactionStats.length > 0 ? transactionStats[0].total : 0,
                    totalTransactionAmount: transactionStats.length > 0 ? transactionStats[0].totalAmount : 0,
                    period: {
                        start: startDate || 'All time',
                        end: endDate || 'Present'
                    }
                }
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    },
    
    getDetailedReport: async (req, res, next) => {
        try {
            const { startDate, endDate } = req.query;
            
            const filter = {};
            
            if (startDate) {
                filter.createdAt = { ...filter.createdAt, $gte: new Date(startDate) };
            }
            
            if (endDate) {
                filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
            }
            
            // Get user growth
            const userGrowth = await User.aggregate([
                { $match: filter },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]);
            
            // Get transaction trends
            const transactionTrends = await Transaction.aggregate([
                { $match: filter },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
                { $sort: { _id: 1 } }
            ]);
            
            // Get top users by transaction count
            const topUsers = await Transaction.aggregate([
                { $match: filter },
                { $group: { _id: '$userId', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
                { $unwind: '$user' },
                { $project: { _id: 0, userId: '$_id', username: '$user.username', count: 1, totalAmount: 1 } }
            ]);
            
            res.status(200).json({
                success: true,
                data: {
                    userGrowth,
                    transactionTrends,
                    topUsers,
                    period: {
                        start: startDate || 'All time',
                        end: endDate || 'Present'
                    }
                }
            });
        } catch (error) {
            error.status = 500;
            next(error);
        }
    }
};

module.exports = adminController;