const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    merchant: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    categories: [{
        type: String
    }],
    items: [{
        name: String,
        price: Number,
        quantity: Number
    }],
    originalFileName: String,
    analysisDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'processed', 'error'],
        default: 'pending'
    },
    aiConfidence: {
        type: Number,
        min: 0,
        max: 1
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Indexes for better query performance
receiptSchema.index({ userId: 1, date: -1 });
receiptSchema.index({ categories: 1 });
receiptSchema.index({ 'items.name': 1 });

module.exports = mongoose.model('Receipt', receiptSchema);
