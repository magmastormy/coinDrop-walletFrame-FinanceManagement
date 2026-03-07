const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            const error = new Error('Authentication required');
            error.status = 401;
            return next(error);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const normalizedUserId = decoded.userId || decoded._id || decoded.id;
        if (!normalizedUserId) {
            const error = new Error('Invalid authentication token payload');
            error.status = 401;
            return next(error);
        }

        req.user = {
            ...decoded,
            _id: normalizedUserId,
            userId: normalizedUserId
        };
        req.authUserId = normalizedUserId;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            error.status = 401;
            error.message = 'Token expired';
        } else {
            error.status = 401;
            error.message = 'Invalid token';
        }
        next(error);
    }
};

const roleMiddleware = (roles) => {
    return async (req, res, next) => {
        if (!req.userProfile) {
            return res.status(403).json({ error: 'User profile not found' });
        }

        if (!roles.includes(req.userProfile.communityRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

const expertiseMiddleware = (areas, minLevel = 'intermediate') => {
    const levelHierarchy = {
        'beginner': 0,
        'intermediate': 1,
        'advanced': 2,
        'expert': 3
    };

    return async (req, res, next) => {
        if (!req.userProfile) {
            return res.status(403).json({ error: 'User profile not found' });
        }

        const hasRequiredExpertise = req.userProfile.expertise.some(exp => 
            areas.includes(exp.area) && 
            levelHierarchy[exp.level] >= levelHierarchy[minLevel]
        );

        if (!hasRequiredExpertise) {
            return res.status(403).json({ error: 'Required expertise level not met' });
        }

        next();
    };
};

const reputationMiddleware = (minScore) => {
    return async (req, res, next) => {
        if (!req.userProfile) {
            return res.status(403).json({ error: 'User profile not found' });
        }

        if (req.userProfile.reputation.score < minScore) {
            return res.status(403).json({ error: 'Insufficient reputation score' });
        }

        next();
    };
};

const verificationMiddleware = async (req, res, next) => {
    if (!req.userProfile) {
        return res.status(403).json({ error: 'User profile not found' });
    }

    if (!req.userProfile.verificationStatus.isVerified) {
        return res.status(403).json({ error: 'Account verification required' });
    }

    next();
};

const moderationMiddleware = async (req, res, next) => {
    if (!req.userProfile) {
        return res.status(403).json({ error: 'User profile not found' });
    }

    const moderationRoles = ['moderator', 'admin'];
    if (!moderationRoles.includes(req.userProfile.communityRole)) {
        return res.status(403).json({ error: 'Moderation privileges required' });
    }

    next();
};

module.exports = {
    authMiddleware,
    roleMiddleware,
    expertiseMiddleware,
    reputationMiddleware,
    verificationMiddleware,
    moderationMiddleware
};
