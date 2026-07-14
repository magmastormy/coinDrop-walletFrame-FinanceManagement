const express = require('express');
const router = express.Router();
const { requireAuth, clerkClient } = require('@clerk/express');
const User = require('../models/User');
const logger = require('../utils/logger');

const hasClerkConfig = () => {
    return process.env.CLERK_SECRET_KEY;
};

router.post('/sync-user', requireAuth({
    authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES?.split(',')?.map(p => p.trim()).filter(Boolean),
}), async (req, res) => {
    if (!hasClerkConfig()) {
        return res.status(500).json({ error: 'Clerk not configured' });
    }

    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
        return res.status(401).json({ error: 'Unauthorized - no Clerk user ID' });
    }

    try {
        let user = await User.findOne({ clerkId: clerkUserId });

        if (user) {
            const clerkUser = await clerkClient.users.getUser(clerkUserId);
            const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

            if (email && email.toLowerCase() !== user.email) {
                user.email = email.toLowerCase();
                await user.save();
                logger.info('Updated user email from Clerk', { clerkUserId, email });
            }

            return res.json({
                success: true,
                message: 'User already exists',
                userId: user._id.toString()
            });
        }

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
            isVerified: true,
            tokens: []
        });

        await user.save();
        logger.info('Synced new user from Clerk', { clerkUserId, email, username });

        res.json({
            success: true,
            message: 'User synced successfully',
            userId: user._id.toString()
        });

    } catch (error) {
        logger.error('Failed to sync Clerk user', { clerkUserId, error: error.message });

        if (error.code === 11000) {
            const clerkUser = await clerkClient.users.getUser(clerkUserId);
            const email = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
            const firstName = clerkUser?.firstName || 'Clerk';
            const lastName = clerkUser?.lastName || 'User';

            if (error.keyPattern?.email) {
                const existingUser = await User.findOne({ email: email.toLowerCase() });
                if (existingUser) {
                    existingUser.clerkId = clerkUserId;
                    await existingUser.save();
                    return res.json({
                        success: true,
                        message: 'User linked to existing account by email',
                        userId: existingUser._id.toString()
                    });
                }
            }

            const uniqueUsername = `${email.split('@')[0] || 'user'}_${Date.now().toString(36)}`;
            const user = new User({
                clerkId: clerkUserId,
                email: email.toLowerCase(),
                firstName,
                lastName,
                username: uniqueUsername,
                isActive: true,
                isVerified: true,
                tokens: []
            });
            await user.save();
            return res.json({
                success: true,
                message: 'User synced with unique username',
                userId: user._id.toString()
            });
        }

        res.status(500).json({ error: 'Failed to sync user', details: error.message });
    }
});

module.exports = router;
