/**
 * Access Control Service
 * 
 * Provides comprehensive access control with role-based permissions,
 * segregation of duties (SoD), and dynamic access evaluation.
 * 
 * @module services/accessControlService
 */

const mongoose = require('mongoose');
const Role = require('../models/Role');
const logger = require('../utils/logger');

/**
 * Access control configuration
 */
const ACCESS_CONFIG = {
    cacheEnabled: true,
    cacheTTL: 300000, // 5 minutes
    sodCheckEnabled: true,
    approvalWorkflowEnabled: true,
    sessionTimeout: 3600, // 1 hour
};

/**
 * Access Control Service class
 */
class AccessControlService {
    constructor() {
        this.permissionCache = new Map();
        this.sodViolations = new Map();
        this.approvalWorkflows = new Map();
        this.userRoles = new Map();
    }

    /**
     * Initialize access control service
     */
    async initialize() {
        try {
            logger.info('Initializing access control service');

            // Initialize default roles
            await Role.initializeDefaultRoles();

            // Start cache cleanup
            this.startCacheCleanup();

            logger.info('Access control service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize access control service:', error);
            throw error;
        }
    }

    /**
     * Check if user has permission
     */
    async checkPermission(userId, resource, action, context = {}) {
        try {
            // Get user roles
            const userRoles = await this.getUserRoles(userId);
            
            if (!userRoles || userRoles.length === 0) {
                return {
                    allowed: false,
                    reason: 'No roles assigned',
                };
            }

            // Check each role
            for (const role of userRoles) {
                // Check if role is active
                if (!role.isActive) {
                    continue;
                }

                // Check time restrictions
                if (!role.isTimeAllowed()) {
                    continue;
                }

                // Check IP restrictions
                if (context.ipAddress && !role.isIpAllowed(context.ipAddress)) {
                    continue;
                }

                // Check permission
                const hasPermission = role.hasPermission(
                    resource,
                    action,
                    context.scope || 'own'
                );

                if (hasPermission) {
                    return {
                        allowed: true,
                        role: role.name,
                        scope: context.scope || 'own',
                    };
                }
            }

            return {
                allowed: false,
                reason: 'Permission not granted by any role',
            };
        } catch (error) {
            logger.error('Permission check failed:', error);
            return {
                allowed: false,
                reason: 'Error checking permissions',
            };
        }
    }

    /**
     * Get user roles with caching
     */
    async getUserRoles(userId) {
        const cacheKey = `roles_${userId}`;
        
        // Check cache
        if (ACCESS_CONFIG.cacheEnabled && this.permissionCache.has(cacheKey)) {
            const cached = this.permissionCache.get(cacheKey);
            if (cached.expiry > Date.now()) {
                return cached.data;
            }
        }

        try {
            // Get user from database
            const User = mongoose.model('User');
            const user = await User.findById(userId).populate('roles');

            if (!user || !user.roles) {
                return [];
            }

            // Cache roles
            if (ACCESS_CONFIG.cacheEnabled) {
                this.permissionCache.set(cacheKey, {
                    data: user.roles,
                    expiry: Date.now() + ACCESS_CONFIG.cacheTTL,
                });
            }

            return user.roles;
        } catch (error) {
            logger.error('Failed to get user roles:', error);
            return [];
        }
    }

    /**
     * Assign role to user
     */
    async assignRole(userId, roleId, assignedBy = null) {
        try {
            // Check SoD constraints
            if (ACCESS_CONFIG.sodCheckEnabled) {
                const sodCheck = await this.checkSoDConstraints(userId, roleId);
                if (!sodCheck.allowed) {
                    return {
                        success: false,
                        error: 'SoD constraint violation',
                        details: sodCheck.violations,
                    };
                }
            }

            // Get user and role
            const User = mongoose.model('User');
            const user = await User.findById(userId);
            const role = await Role.findById(roleId);

            if (!user || !role) {
                return {
                    success: false,
                    error: 'User or role not found',
                };
            }

            // Check max users limit
            if (role.maxUsers > 0) {
                const currentUsers = await User.countDocuments({ roles: roleId });
                if (currentUsers >= role.maxUsers) {
                    return {
                        success: false,
                        error: 'Role has reached maximum user limit',
                    };
                }
            }

            // Add role to user
            if (!user.roles.includes(roleId)) {
                user.roles.push(roleId);
                await user.save();
            }

            // Clear cache
            this.clearUserCache(userId);

            logger.info(`Role ${role.name} assigned to user ${userId}`);

            return {
                success: true,
                role: role.name,
            };
        } catch (error) {
            logger.error('Failed to assign role:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Remove role from user
     */
    async removeRole(userId, roleId) {
        try {
            const User = mongoose.model('User');
            const user = await User.findById(userId);

            if (!user) {
                return {
                    success: false,
                    error: 'User not found',
                };
            }

            // Remove role
            user.roles = user.roles.filter(r => r.toString() !== roleId.toString());
            await user.save();

            // Clear cache
            this.clearUserCache(userId);

            logger.info(`Role removed from user ${userId}`);

            return {
                success: true,
            };
        } catch (error) {
            logger.error('Failed to remove role:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Check SoD constraints
     */
    async checkSoDConstraints(userId, newRoleId) {
        try {
            const userRoles = await this.getUserRoles(userId);
            const newRole = await Role.findById(newRoleId);

            if (!newRole) {
                return { allowed: true };
            }

            const violations = [];

            // Check if new role conflicts with existing roles
            for (const existingRole of userRoles) {
                // Check if existing role is in new role's SoD constraints
                if (newRole.sodConstraints.some(
                    constraint => constraint.toString() === existingRole._id.toString()
                )) {
                    violations.push({
                        type: 'mutual_exclusion',
                        role1: existingRole.name,
                        role2: newRole.name,
                        message: `Role ${newRole.name} cannot be combined with ${existingRole.name}`,
                    });
                }

                // Check if new role is in existing role's SoD constraints
                if (existingRole.sodConstraints.some(
                    constraint => constraint.toString() === newRoleId.toString()
                )) {
                    violations.push({
                        type: 'mutual_exclusion',
                        role1: existingRole.name,
                        role2: newRole.name,
                        message: `Role ${existingRole.name} cannot be combined with ${newRole.name}`,
                    });
                }
            }

            // Check for approval workflow requirements
            if (ACCESS_CONFIG.approvalWorkflowEnabled && violations.length > 0) {
                const canApprove = await this.checkApprovalWorkflow(userId, newRoleId, violations);
                if (canApprove) {
                    return { allowed: true, requiresApproval: true };
                }
            }

            return {
                allowed: violations.length === 0,
                violations,
            };
        } catch (error) {
            logger.error('SoD check failed:', error);
            return { allowed: false, error: error.message };
        }
    }

    /**
     * Check approval workflow
     */
    async checkApprovalWorkflow(userId, roleId, violations) {
        // This would integrate with an approval workflow system
        // For now, return false to require manual approval
        return false;
    }

    /**
     * Create approval request
     */
    async createApprovalRequest(requestData) {
        try {
            const request = {
                id: new mongoose.Types.ObjectId(),
                userId: requestData.userId,
                roleId: requestData.roleId,
                requestedBy: requestData.requestedBy,
                reason: requestData.reason,
                violations: requestData.violations || [],
                status: 'pending',
                createdAt: new Date(),
                approvers: [],
            };

            this.approvalWorkflows.set(request.id.toString(), request);

            logger.info(`Approval request created: ${request.id}`);

            return {
                success: true,
                requestId: request.id,
            };
        } catch (error) {
            logger.error('Failed to create approval request:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Approve request
     */
    async approveRequest(requestId, approverId, comments = '') {
        try {
            const request = this.approvalWorkflows.get(requestId);

            if (!request) {
                return {
                    success: false,
                    error: 'Request not found',
                };
            }

            if (request.status !== 'pending') {
                return {
                    success: false,
                    error: 'Request is not pending',
                };
            }

            // Add approver
            request.approvers.push({
                approverId,
                approvedAt: new Date(),
                comments,
            });

            // Check if enough approvals (dual control)
            if (request.approvers.length >= 2) {
                request.status = 'approved';
                
                // Assign role
                await this.assignRole(request.userId, request.roleId, approverId);
            }

            logger.info(`Request ${requestId} approved by ${approverId}`);

            return {
                success: true,
                status: request.status,
            };
        } catch (error) {
            logger.error('Failed to approve request:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Reject request
     */
    async rejectRequest(requestId, approverId, reason) {
        try {
            const request = this.approvalWorkflows.get(requestId);

            if (!request) {
                return {
                    success: false,
                    error: 'Request not found',
                };
            }

            request.status = 'rejected';
            request.rejectedBy = approverId;
            request.rejectionReason = reason;
            request.rejectedAt = new Date();

            logger.info(`Request ${requestId} rejected by ${approverId}`);

            return {
                success: true,
            };
        } catch (error) {
            logger.error('Failed to reject request:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get user permissions summary
     */
    async getUserPermissions(userId) {
        try {
            const userRoles = await this.getUserRoles(userId);
            const permissions = new Map();

            for (const role of userRoles) {
                for (const perm of role.effectivePermissions) {
                    if (!permissions.has(perm.resource)) {
                        permissions.set(perm.resource, {
                            resource: perm.resource,
                            actions: new Set(),
                            scope: perm.scope,
                        });
                    }

                    const existing = permissions.get(perm.resource);
                    perm.actions.forEach(action => existing.actions.add(action));
                    
                    // Upgrade scope if necessary
                    const scopeHierarchy = ['own', 'team', 'department', 'organization', 'all'];
                    if (scopeHierarchy.indexOf(perm.scope) > scopeHierarchy.indexOf(existing.scope)) {
                        existing.scope = perm.scope;
                    }
                }
            }

            return Array.from(permissions.values()).map(p => ({
                ...p,
                actions: Array.from(p.actions),
            }));
        } catch (error) {
            logger.error('Failed to get user permissions:', error);
            return [];
        }
    }

    /**
     * Get role hierarchy
     */
    async getRoleHierarchy() {
        try {
            return await Role.getHierarchy();
        } catch (error) {
            logger.error('Failed to get role hierarchy:', error);
            return [];
        }
    }

    /**
     * Create custom role
     */
    async createRole(roleData) {
        try {
            const role = new Role(roleData);
            await role.save();

            logger.info(`Created role: ${role.name}`);

            return {
                success: true,
                role: role.toObject(),
            };
        } catch (error) {
            logger.error('Failed to create role:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Update role
     */
    async updateRole(roleId, updates) {
        try {
            const role = await Role.findByIdAndUpdate(
                roleId,
                updates,
                { new: true }
            );

            if (!role) {
                return {
                    success: false,
                    error: 'Role not found',
                };
            }

            // Clear cache for all users with this role
            this.clearRoleCache(roleId);

            logger.info(`Updated role: ${role.name}`);

            return {
                success: true,
                role: role.toObject(),
            };
        } catch (error) {
            logger.error('Failed to update role:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Delete role
     */
    async deleteRole(roleId) {
        try {
            const role = await Role.findById(roleId);

            if (!role) {
                return {
                    success: false,
                    error: 'Role not found',
                };
            }

            if (role.isSystem) {
                return {
                    success: false,
                    error: 'Cannot delete system role',
                };
            }

            // Check if role is assigned to any users
            const User = mongoose.model('User');
            const userCount = await User.countDocuments({ roles: roleId });

            if (userCount > 0) {
                return {
                    success: false,
                    error: `Role is assigned to ${userCount} users`,
                };
            }

            await Role.findByIdAndDelete(roleId);

            // Clear cache
            this.clearRoleCache(roleId);

            logger.info(`Deleted role: ${role.name}`);

            return {
                success: true,
            };
        } catch (error) {
            logger.error('Failed to delete role:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Clear user cache
     */
    clearUserCache(userId) {
        const cacheKey = `roles_${userId}`;
        this.permissionCache.delete(cacheKey);
    }

    /**
     * Clear role cache
     */
    clearRoleCache(roleId) {
        // Clear all caches since role changes affect all users
        this.permissionCache.clear();
    }

    /**
     * Start cache cleanup
     */
    startCacheCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.permissionCache) {
                if (value.expiry < now) {
                    this.permissionCache.delete(key);
                }
            }
        }, 60000); // Clean up every minute
    }

    /**
     * Get access control statistics
     */
    async getStats() {
        try {
            const [totalRoles, activeRoles, totalUsers] = await Promise.all([
                Role.countDocuments(),
                Role.countDocuments({ isActive: true }),
                mongoose.model('User').countDocuments(),
            ]);

            return {
                totalRoles,
                activeRoles,
                totalUsers,
                cacheSize: this.permissionCache.size,
                pendingApprovals: Array.from(this.approvalWorkflows.values())
                    .filter(r => r.status === 'pending').length,
            };
        } catch (error) {
            logger.error('Failed to get access control stats:', error);
            return null;
        }
    }

    /**
     * Audit access check
     */
    async auditAccess(userId, resource, action, result, context = {}) {
        try {
            const comprehensiveAuditService = require('./comprehensiveAuditService');
            
            await comprehensiveAuditService.logUserAction({
                userId,
                action: `ACCESS_${result.allowed ? 'GRANTED' : 'DENIED'}`,
                entityType: 'access_control',
                entityId: resource,
                details: {
                    resource,
                    action,
                    allowed: result.allowed,
                    reason: result.reason,
                    role: result.role,
                },
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                status: result.allowed ? 'success' : 'failure',
            });
        } catch (error) {
            logger.error('Failed to audit access check:', error);
        }
    }
}

// Export singleton instance
module.exports = new AccessControlService();
