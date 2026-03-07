const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/receipts');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Fallback to Date.now() if uuidv4 fails
        const uniqueFileName = uuidv4 
            ? uuidv4() + path.extname(file.originalname)
            : `${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueFileName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only .png, .jpg, .jpeg and .pdf format allowed!'));
    }
});

// Mock AI analysis function (replace with actual AI implementation)
const analyzeReceipt = async (filePath) => {
    // TODO: Implement actual AI analysis
    // This is a mock implementation
    return {
        totalAmount: 123.45,
        date: new Date().toISOString().split('T')[0],
        merchant: "Sample Store",
        categories: ["Groceries", "Household"],
        items: [
            { name: "Item 1", price: 50.00 },
            { name: "Item 2", price: 73.45 }
        ]
    };
};

// Route intentionally hard-disabled until secure pipeline is implemented
router.post('/analyze', authMiddleware, upload.single('receipt'), async (_req, res) => {
    return res.status(503).json({
        error: 'Receipt analysis temporarily unavailable',
        details: 'Endpoint is disabled until secure production pipeline is implemented.'
    });
});

module.exports = router;
