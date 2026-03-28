const roleMiddleware = {
    // Middleware to check if user is admin
    isAdmin: (req, res, next) => {
        try {
            if (!req.user || req.user.role !== 'admin') {
                const error = new Error('Access denied');
                error.status = 403;
                return next(error);
            }
            next();
        } catch (error) {
            error.status = 401;
            error.message = 'Authentication required';
            next(error);
        }
    },

    // Middleware to check if user has specific role
    hasRole: (roles) => {
        return (req, res, next) => {
            try {
                if (!req.user || !roles.includes(req.user.role)) {
                    const error = new Error('Access denied');
                    error.status = 403;
                    return next(error);
                }
                next();
            } catch (error) {
                error.status = 401;
                error.message = 'Authentication required';
                next(error);
            }
        };
    }
};

module.exports = roleMiddleware;