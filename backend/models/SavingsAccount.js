const mongoose = require('mongoose');

const SavingsAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    balance: {
        type: Number,
        default: 0
    },
    automation: {
        type: {
            type: String,
            enum: ['fixed', 'percentage'],
            required: true
        },
        amount: {
            type: Number,
            required: function() {
                return this.type === 'fixed';
            }
        },
        percentage: {
            type: Number,
            required: function() {
                return this.type === 'percentage';
            }
        },
        frequency: {
            type: String,
            enum: ['monthly', 'weekly'],
            required: true
        }
    }
}, {
    timestamps: true
});

const SavingsAccount = mongoose.model('SavingsAccount', SavingsAccountSchema);
module.exports = SavingsAccount;