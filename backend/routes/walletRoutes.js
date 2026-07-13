const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const WalletController = require('../controllers/walletController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validationMiddleware, sanitizationMiddleware } = require('../middleware/validationMiddleware');

// Wallet Validation Middleware
const walletCreationValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('Wallet name must be between 2 and 50 characters'),
    body('type')
        .isIn(['cash', 'bank', 'credit', 'investment', 'savings', 'other'])
        .withMessage('Invalid wallet type'),
    body('balance')
        .optional()
        .isFloat({ min: 0 }).withMessage('Balance must be a non-negative number'),
    body('currency')
        .optional()
        .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter ISO code')
];

// Protect all wallet routes
router.use(authMiddleware);
router.use(sanitizationMiddleware);

// Wallet Routes
router.post('/', 
    sanitizationMiddleware, 
    walletCreationValidation, 
    validationMiddleware, 
    WalletController.createWallet
);
router.get('/', sanitizationMiddleware, WalletController.getUserWallets);
router.get('/:id/budgets', sanitizationMiddleware, WalletController.getWalletBudgets);
router.put('/:id', 
    sanitizationMiddleware, 
    walletCreationValidation, 
    validationMiddleware, 
    WalletController.updateWallet
);
router.delete('/:id', sanitizationMiddleware, WalletController.deleteWallet);
router.get('/stats', sanitizationMiddleware, WalletController.getWalletStats);

// Balance Transfer Route
router.post('/transfer', 
    sanitizationMiddleware,
    [
        body('fromWalletId').notEmpty().withMessage('Source wallet ID is required'),
        body('toWalletId').notEmpty().withMessage('Destination wallet ID is required'),
        body('amount').isFloat({ min: 0.01 }).withMessage('Transfer amount must be a positive number')
    ],
    validationMiddleware,
    WalletController.transferBalance
);

module.exports = router;
