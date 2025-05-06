require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const ensureUploadDirectories = require('./utils/ensureUploadDirs');
const receiptRoutes = require('./routes/receiptRoutes');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const walletRoutes = require('./routes/walletRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const profileRoutes = require('./routes/profileRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const educationRoutes = require('./routes/educationRoutes');
const savingsAccountRoutes = require('./routes/savingsAccountRoutes');
const savingsGoalRoutes = require('./routes/savingsGoalRoutes');
const savingsRuleRoutes = require('./routes/savingsRuleRoutes');
const zhipuaiRoutes = require('./routes/zhipuaiRoutes');
const imageRoutes = require('./routes/imageRoutes');
const reportRoutes = require('./routes/reportRoutes');
//const testRoutes = require('./routes/testRoutes');

const {initCloudinary} = require('./config/cloudinary');
const categoryInit = require('./config/categoryInit');
const app = express();

// Connect Database
connectDB();

// Initialize Cloudinary
initCloudinary();

//Initialize the CategoryAI
categoryInit();

// Ensure upload directories exist
ensureUploadDirectories()
    .then(() => console.log('Upload directories ready'))
    .catch(err => console.error('Error setting up upload directories:', err));

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ extended: false }));

// Increase payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logging Middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Define Routes
app.use('/api/receipts', receiptRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/saving-accounts', savingsAccountRoutes);
app.use('/api/saving-goals', savingsGoalRoutes);
app.use('/api/savings-rules', savingsRuleRoutes);
app.use('/api/zhipuai', zhipuaiRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/reports', reportRoutes);
//app.use('/api/test', testRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        env: process.env.NODE_ENV || 'development'
    });
});

// 404 Not Found Handler
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: err.message || 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});

module.exports = app;