const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN',
            'LOGOUT',
            'REGISTER',
            'PASSWORD_CHANGE',
            'PROFILE_UPDATE',
            'ACCOUNT_DELETE',
            'API_ACCESS',
            'AUTHORIZATION_FAILURE',
            'PASSWORD_RESET',
            'TOKEN_REFRESH',
            'TRANSACTION_CREATE',
            'TRANSACTION_UPDATE',
            'TRANSACTION_DELETE',
            'TRANSACTION_VIEW'
        ]
    },
    resource: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['SUCCESS', 'FAILURE', 'WARNING']
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster querying
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ status: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

module.exports = AuditLog;