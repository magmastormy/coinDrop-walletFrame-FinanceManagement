const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

// Apply authentication and admin authorization to all routes
router.use(authMiddleware);
router.use(isAdmin);

// Dashboard routes
router.get('/dashboard/overview', adminController.getDashboardOverview);
router.get('/dashboard/statistics', adminController.getDashboardStatistics);

// User management routes
router.get('/users', adminController.listUsers);
router.get('/users/:id', adminController.getUserDetails);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Transaction management routes
router.get('/transactions', adminController.listTransactions);
router.get('/transactions/:id', adminController.getTransactionDetails);
router.get('/transactions/statistics', adminController.getTransactionStatistics);

// System routes
router.get('/system/health', adminController.getSystemHealth);
router.get('/system/metrics', adminController.getSystemMetrics);

// Report routes
router.get('/reports/summary', adminController.getSummaryReport);
router.get('/reports/detailed', adminController.getDetailedReport);

module.exports = router;