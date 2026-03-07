function getAuthenticatedUserId(req) {
    const userId = req?.user?._id || req?.user?.userId;
    if (!userId) {
        const error = new Error('Authentication required');
        error.status = 401;
        throw error;
    }
    return userId;
}

module.exports = {
    getAuthenticatedUserId
};
