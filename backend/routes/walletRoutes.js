const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const WalletController = require('../controllers/walletController');
const { authMiddleware } = require('../middleware/authMiddleware');

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

// Wallet Routes
router.post('/', 
    walletCreationValidation, 
    WalletController.createWallet
);
router.get('/', WalletController.getUserWallets);
router.put('/:id', 
    walletCreationValidation, 
    WalletController.updateWallet
);
router.delete('/:id', WalletController.deleteWallet);
router.get('/stats', WalletController.getWalletStats);

// Balance Transfer Route
router.post('/transfer', 
    [
        body('fromWalletId').notEmpty().withMessage('Source wallet ID is required'),
        body('toWalletId').notEmpty().withMessage('Destination wallet ID is required'),
        body('amount').isFloat({ min: 0.01 }).withMessage('Transfer amount must be a positive number')
    ],
    WalletController.transferBalance
);

module.exports = router;
