const mongoose = require('mongoose');
const validator = require('validator');

const WalletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    name: {
        type: String,
        required: [true, 'Wallet name is required'],
        trim: true,
        minlength: [2, 'Wallet name must be at least 2 characters long'],
        maxlength: [50, 'Wallet name cannot exceed 50 characters']
    },
    type: {
        type: String,
        enum: {
            values: ['cash', 'bank', 'credit', 'investment', 'savings', 'other'],
            message: '{VALUE} is not a valid wallet type'
        },
        default: 'cash'
    },
    balance: {
        type: Number,
        default: 0,
        validate: {
            validator: Number.isFinite,
            message: 'Balance must be a valid number'
        }
    },
    currency: {
        type: String,
        default: 'USD',
        uppercase: true,
        validate: {
            validator: (value) => validator.isISO4217(value),
            message: 'Invalid currency code'
        }
    },
    institution: {
        type: String,
        trim: true,
        maxlength: [100, 'Institution name cannot exceed 100 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    metadata: {
        icon: {
            type: String,
            default: 'wallet'
        },
        color: {
            type: String,
            default: '#007bff'
        }
    },
    lastTransactionDate: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total transactions
WalletSchema.virtual('totalTransactions', {
    ref: 'Transaction',
    localField: '_id',
    foreignField: 'walletId',
    count: true
});

// Method to update balance
WalletSchema.methods.updateBalance = async function(amount) {
    this.balance += amount;
    await this.save();
    return this.balance;
};

// Static method to get user's wallets
WalletSchema.statics.getUserWallets = async function(userId) {
    return this.find({ userId, isActive: true })
        .sort({ balance: -1 });
};

const Wallet = mongoose.model('Wallet', WalletSchema);

module.exports = Wallet;
