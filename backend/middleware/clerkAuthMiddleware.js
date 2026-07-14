/**
 * Clerk Authentication Middleware
 * Handles user authentication using Clerk's session tokens
 * Falls back to JWT for API-only authentication
 * 
 * Normalizes Clerk's auth data to match the existing req.user / req.authUserId pattern
 * so all controllers continue to work without modification.
 */
const { ClerkExpressRequireAuth, clerkClient } = require('@clerk/express');
const logger = require('../utils/logger');
const User = require('../models/User');

const hasClerkConfig = () => {
    return process.env.CLERK_SECRET_KEY;
};

const clerkAuthMiddleware = async (req, res, next) => {
    if (!hasClerkConfig()) {
        return next();
    }

    const clerkMiddleware = ClerkExpressRequireAuth({
        authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES?.split(',')?.map(p => p.trim()).filter(Boolean),
    });

    try {
        await clerkMiddleware(req, res, async () => {
            if (req.auth && req.auth.userId) {
                const clerkUserId = req.auth.userId;
                
                let user = await User.findOne({ clerkId: clerkUserId });
                
                if (!user) {
                    try {
                        const clerkUser = await clerkClient.users.getUser(clerkUserId);
                        
                        const email = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
                        const firstName = clerkUser?.firstName || 'Clerk';
                        const lastName = clerkUser?.lastName || 'User';
                        const username = clerkUser?.username || email.split('@')[0] || `user_${clerkUserId.slice(0, 8)}`;

                        user = new User({
                            clerkId: clerkUserId,
                            email: email.toLowerCase(),
                            firstName,
                            lastName,
                            username,
                            isActive: true,
                            tokens: []
                        });
                        await user.save();
                        logger.info('Created new user from Clerk session', { clerkUserId, email });
                    } catch (fetchError) {
                        logger.error('Failed to fetch Clerk user details', { error: fetchError.message });
                        return res.status(500).json({ error: 'Failed to create user account' });
                    }
                }

                req.user = user.toObject ? user.toObject() : user;
                delete req.user.password;
                req.authUserId = user._id.toString();
                req.tokenJti = req.auth.sessionId;
            }
            next();
        });
    } catch (error) {
        logger.warn('Clerk authentication failed', { error: error.message });
        next(error);
    }
};

module.exports = {
    clerkAuthMiddleware,
    hasClerkConfig
};
