const mongoose = require('mongoose');

const SavingsGoalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    targetAmount: {
        type: Number,
        required: true
    },
    currentAmount: {
        type: Number,
        default: 0
    },
    deadline: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        default: '' 
    },
    isActive: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['active', 'deleted'],
        default: 'active'
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for performance
SavingsGoalSchema.index({ userId: 1 });
SavingsGoalSchema.index({ userId: 1, isActive: 1 });
SavingsGoalSchema.index({ userId: 1, deadline: -1 });
SavingsGoalSchema.index({ userId: 1, currentAmount: -1 });

const SavingsGoal = mongoose.model('SavingsGoal', SavingsGoalSchema);
module.exports = SavingsGoal;