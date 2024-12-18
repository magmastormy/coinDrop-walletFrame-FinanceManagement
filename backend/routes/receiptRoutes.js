const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

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

// Route to handle receipt upload and analysis
router.post('/analyze', upload.single('receipt'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const filePath = req.file.path;
        
        // Analyze the receipt
        const analysisResults = await analyzeReceipt(filePath);

        // Store the results in database (implement this based on your data model)
        // TODO: Implement database storage

        // Clean up the uploaded file
        await fs.unlink(filePath);

        res.json(analysisResults);
    } catch (error) {
        console.error('Receipt analysis error:', error);
        res.status(500).json({ message: 'Error analyzing receipt' });
    }
});

module.exports = router;
