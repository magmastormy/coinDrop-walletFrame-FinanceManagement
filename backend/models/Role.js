/**
 * Role Model
 * 
 * Defines roles with hierarchical permissions for enterprise-grade
 * access control with granular permission management.
 * 
 * @module models/Role
 */

const mongoose = require('mongoose');

/**
 * Permission schema for individual permissions
 */
const PermissionSchema = new mongoose.Schema({
    resource: {
        type: String,
        required: true,
        index: true,
    },
    actions: [{
        type: String,
        enum: ['create', 'read', 'update', 'delete', 'execute', 'manage'],
    }],
    conditions: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {},
    },
    scope: {
        type: String,
        enum: ['own', 'team', 'department', 'organization', 'all'],
        default: 'own',
    },
}, { _id: false });

/**
 * Role schema
 */
const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        maxlength: 500,
    },
    level: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        index: true,
    },
    parentRole: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        default: null,
    },
    permissions: [PermissionSchema],
    inheritedPermissions: [PermissionSchema],
    effectivePermissions: [PermissionSchema],
    isSystem: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    maxUsers: {
        type: Number,
        default: 0, // 0 = unlimited
    },
    requiresMfa: {
        type: Boolean,
        default: false,
    },
    sessionTimeout: {
        type: Number,
        default: 3600, // 1 hour in seconds
    },
    allowedIpRanges: [{
        type: String,
    }],
    timeRestrictions: {
        enabled: {
            type: Boolean,
            default: false,
        },
        timezone: {
            type: String,
            default: 'UTC',
        },
        allowedDays: [{
            type: String,
            enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        }],
        allowedHours: {
            start: {
                type: Number,
                min: 0,
                max: 23,
                default: 0,
            },
            end: {
                type: Number,
                min: 0,
                max: 23,
                default: 23,
            },
        },
    },
    sodConstraints: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
    }],
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

// Indexes
RoleSchema.index({ name: 1 });
RoleSchema.index({ level: 1 });
RoleSchema.index({ parentRole: 1 });
RoleSchema.index({ isActive: 1 });
RoleSchema.index({ 'permissions.resource': 1 });

/**
 * Pre-save middleware to calculate effective permissions
 */
RoleSchema.pre('save', async function(next) {
    if (this.isModified('permissions') || this.isModified('parentRole')) {
        await this.calculateEffectivePermissions();
    }
    next();
});

/**
 * Calculate effective permissions including inherited ones
 */
RoleSchema.methods.calculateEffectivePermissions = async function() {
    const effectivePermissions = new Map();

    // Add own permissions
    this.permissions.forEach(perm => {
        effectivePermissions.set(perm.resource, perm);
    });

    // Add inherited permissions from parent
    if (this.parentRole) {
        const Role = mongoose.model('Role');
        const parent = await Role.findById(this.parentRole);
        
        if (parent) {
            this.inheritedPermissions = parent.effectivePermissions || [];
            
            parent.effectivePermissions.forEach(perm => {
                if (!effectivePermissions.has(perm.resource)) {
                    effectivePermissions.set(perm.resource, perm);
                }
            });
        }
    }

    this.effectivePermissions = Array.from(effectivePermissions.values());
};

/**
 * Check if role has specific permission
 */
RoleSchema.methods.hasPermission = function(resource, action, scope = null) {
    const permission = this.effectivePermissions.find(p => p.resource === resource);
    
    if (!permission) {
        return false;
    }

    const hasAction = permission.actions.includes(action) || permission.actions.includes('manage');
    
    if (!hasAction) {
        return false;
    }

    if (scope && permission.scope) {
        const scopeHierarchy = ['own', 'team', 'department', 'organization', 'all'];
        const requiredLevel = scopeHierarchy.indexOf(scope);
        const grantedLevel = scopeHierarchy.indexOf(permission.scope);
        
        return grantedLevel >= requiredLevel;
    }

    return true;
};

/**
 * Get all permissions for a resource
 */
RoleSchema.methods.getPermissionsForResource = function(resource) {
    return this.effectivePermissions.filter(p => p.resource === resource);
};

/**
 * Add permission to role
 */
RoleSchema.methods.addPermission = function(resource, actions, options = {}) {
    const existingIndex = this.permissions.findIndex(p => p.resource === resource);
    
    const newPermission = {
        resource,
        actions: Array.isArray(actions) ? actions : [actions],
        conditions: options.conditions || {},
        scope: options.scope || 'own',
    };

    if (existingIndex >= 0) {
        // Merge actions
        const existing = this.permissions[existingIndex];
        const mergedActions = [...new Set([...existing.actions, ...newPermission.actions])];
        existing.actions = mergedActions;
        existing.conditions = { ...existing.conditions, ...newPermission.conditions };
        existing.scope = newPermission.scope || existing.scope;
    } else {
        this.permissions.push(newPermission);
    }

    return this.save();
};

/**
 * Remove permission from role
 */
RoleSchema.methods.removePermission = function(resource, actions = null) {
    if (!actions) {
        // Remove entire permission
        this.permissions = this.permissions.filter(p => p.resource !== resource);
    } else {
        // Remove specific actions
        const permission = this.permissions.find(p => p.resource === resource);
        if (permission) {
            const actionsToRemove = Array.isArray(actions) ? actions : [actions];
            permission.actions = permission.actions.filter(a => !actionsToRemove.includes(a));
            
            // Remove permission if no actions left
            if (permission.actions.length === 0) {
                this.permissions = this.permissions.filter(p => p.resource !== resource);
            }
        }
    }

    return this.save();
};

/**
 * Check time restrictions
 */
RoleSchema.methods.isTimeAllowed = function() {
    if (!this.timeRestrictions.enabled) {
        return true;
    }

    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
    const currentHour = now.getHours();

    // Check day
    if (this.timeRestrictions.allowedDays.length > 0 &&
        !this.timeRestrictions.allowedDays.includes(currentDay)) {
        return false;
    }

    // Check hour
    if (currentHour < this.timeRestrictions.allowedHours.start ||
        currentHour > this.timeRestrictions.allowedHours.end) {
        return false;
    }

    return true;
};

/**
 * Check IP restrictions
 */
RoleSchema.methods.isIpAllowed = function(ipAddress) {
    if (!this.allowedIpRanges || this.allowedIpRanges.length === 0) {
        return true;
    }

    // Simple IP matching (can be enhanced with CIDR support)
    return this.allowedIpRanges.some(range => ipAddress.startsWith(range));
};

/**
 * Static method to get role hierarchy
 */
RoleSchema.statics.getHierarchy = async function() {
    const roles = await this.find({ isActive: true })
        .select('name level parentRole permissions')
        .sort({ level: 1 })
        .lean();

    const buildTree = (parentId = null) => {
        return roles
            .filter(r => String(r.parentRole) === String(parentId))
            .map(r => ({
                ...r,
                children: buildTree(r._id),
            }));
    };

    return buildTree();
};

/**
 * Static method to find roles by permission
 */
RoleSchema.statics.findByPermission = async function(resource, action) {
    return this.find({
        isActive: true,
        $or: [
            { 'permissions.resource': resource, 'permissions.actions': action },
            { 'permissions.resource': resource, 'permissions.actions': 'manage' },
        ],
    });
};

/**
 * Static method to get default roles
 */
RoleSchema.statics.getDefaultRoles = function() {
    return [
        {
            name: 'System Administrator',
            description: 'Full system access with all permissions',
            level: 100,
            permissions: [{
                resource: '*',
                actions: ['manage'],
                scope: 'all',
            }],
            isSystem: true,
            requiresMfa: true,
        },
        {
            name: 'Security Administrator',
            description: 'Manages security settings and user access',
            level: 90,
            permissions: [
                { resource: 'users', actions: ['read', 'update', 'manage'], scope: 'organization' },
                { resource: 'roles', actions: ['read', 'update', 'manage'], scope: 'organization' },
                { resource: 'permissions', actions: ['read', 'update', 'manage'], scope: 'organization' },
                { resource: 'security', actions: ['read', 'update', 'manage'], scope: 'organization' },
                { resource: 'audit', actions: ['read'], scope: 'organization' },
            ],
            isSystem: true,
            requiresMfa: true,
        },
        {
            name: 'Finance Administrator',
            description: 'Manages financial operations and transactions',
            level: 80,
            permissions: [
                { resource: 'transactions', actions: ['read', 'update', 'manage'], scope: 'organization' },
                { resource: 'accounts', actions: ['read', 'update', 'manage'], scope: 'organization' },
                { resource: 'reports', actions: ['read', 'create', 'manage'], scope: 'organization' },
                { resource: 'audit', actions: ['read'], scope: 'organization' },
            ],
            isSystem: true,
            sodConstraints: [], // Will be populated with conflicting roles
        },
        {
            name: 'Transaction Operator',
            description: 'Processes transactions with approval requirements',
            level: 60,
            permissions: [
                { resource: 'transactions', actions: ['create', 'read'], scope: 'own' },
                { resource: 'accounts', actions: ['read'], scope: 'own' },
            ],
            isSystem: true,
        },
        {
            name: 'Transaction Approver',
            description: 'Approves transactions created by operators',
            level: 70,
            permissions: [
                { resource: 'transactions', actions: ['read', 'update'], scope: 'team' },
                { resource: 'accounts', actions: ['read'], scope: 'team' },
            ],
            isSystem: true,
            sodConstraints: [], // Will be populated with conflicting roles
        },
        {
            name: 'Auditor',
            description: 'Read-only access to audit logs and reports',
            level: 50,
            permissions: [
                { resource: 'audit', actions: ['read'], scope: 'organization' },
                { resource: 'reports', actions: ['read'], scope: 'organization' },
                { resource: 'transactions', actions: ['read'], scope: 'organization' },
            ],
            isSystem: true,
        },
        {
            name: 'Standard User',
            description: 'Basic user with limited access',
            level: 10,
            permissions: [
                { resource: 'profile', actions: ['read', 'update'], scope: 'own' },
                { resource: 'transactions', actions: ['read'], scope: 'own' },
            ],
            isSystem: true,
        },
    ];
};

/**
 * Static method to initialize default roles
 */
RoleSchema.statics.initializeDefaultRoles = async function() {
    const defaultRoles = this.getDefaultRoles();
    
    for (const roleData of defaultRoles) {
        const existing = await this.findOne({ name: roleData.name });
        
        if (!existing) {
            await this.create(roleData);
            logger.info(`Created default role: ${roleData.name}`);
        }
    }

    // Set up SoD constraints after roles are created
    await this.setupSoDConstraints();
};

/**
 * Static method to setup SoD constraints
 */
RoleSchema.statics.setupSoDConstraints = async function() {
    const financeAdmin = await this.findOne({ name: 'Finance Administrator' });
    const transactionOperator = await this.findOne({ name: 'Transaction Operator' });
    const transactionApprover = await this.findOne({ name: 'Transaction Approver' });

    if (financeAdmin && transactionOperator) {
        financeAdmin.sodConstraints = [transactionOperator._id];
        await financeAdmin.save();
    }

    if (transactionOperator && transactionApprover) {
        transactionOperator.sodConstraints = [transactionApprover._id];
        transactionApprover.sodConstraints = [transactionOperator._id];
        await Promise.all([
            transactionOperator.save(),
            transactionApprover.save(),
        ]);
    }
};

const Role = mongoose.model('Role', RoleSchema);

module.exports = Role;
