const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['financial-summary', 'budget-analysis', 'savings-report']
    },
    format: {
        type: String,
        required: true,
        enum: ['PDF', 'EXCEL']
    },
    status: {
        type: String,
        required: true,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    filePath: String,
    generatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Report', reportSchema); 