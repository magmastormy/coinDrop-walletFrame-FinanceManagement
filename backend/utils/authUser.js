function getAuthenticatedUserId(req) {
    const userId = req?.user?._id || req?.user?.userId || req?.authUserId;
    if (!userId) {
        const error = new Error('Authentication required');
        error.status = 401;
        throw error;
    }
    return userId;
}

/**
 * Validates that a resource belongs to the authenticated user
 * @param {Object} resource - The resource object to validate
 * @param {string} userId - The authenticated user's ID
 * @param {string} resourceName - Name of the resource for error messages
 * @throws {Error} If resource doesn't belong to user
 */
function validateResourceOwnership(resource, userId, resourceName = 'Resource') {
    if (!resource) {
        const error = new Error(`${resourceName} not found`);
        error.status = 404;
        throw error;
    }
    
    if (String(resource.userId) !== String(userId)) {
        const error = new Error(`Unauthorized access to ${resourceName.toLowerCase()}`);
        error.status = 403;
        throw error;
    }
}

/**
 * Validates ObjectId format before database queries
 * @param {string|ObjectId} id - The ID to validate
 * @returns {boolean} True if valid ObjectId format
 */
function isValidIdFormat(id) {
    const mongoose = require('mongoose');
    return mongoose.Types.ObjectId.isValid(id);
}

module.exports = {
    getAuthenticatedUserId,
    validateResourceOwnership,
    isValidIdFormat
};
