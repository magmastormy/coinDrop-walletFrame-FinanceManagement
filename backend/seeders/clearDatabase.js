const logger = require('../utils/logger');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Wallet = require('../models/Wallet');
const SavingsAccount = require('../models/SavingsAccount');
const Education = require('../models/Education');
const SavingsGoal = require('../models/SavingsGoal');
const SavingsRule = require('../models/SavingsRule');
const UserProfile = require('../models/UserProfile');

const clearDatabase = async () => {
    try {
        // Connect to MongoDB
        logger.debug('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        logger.debug('Connected successfully to MongoDB');

        // Store collection counts before deletion
        const beforeCounts = await Promise.all([
            User.countDocuments(),
            Budget.countDocuments(),
            Transaction.countDocuments(),
            Category.countDocuments(),
            Wallet.countDocuments(),
            SavingsAccount.countDocuments(),
            Education.countDocuments(),
            SavingsGoal.countDocuments(),
            SavingsRule.countDocuments(),
            UserProfile.countDocuments()
        ]);

        logger.debug('\nCurrent collection counts:');
        logger.debug('Users:', beforeCounts[0]);
        logger.debug('Budgets:', beforeCounts[1]);
        logger.debug('Transactions:', beforeCounts[2]);
        logger.debug('Categories:', beforeCounts[3]);
        logger.debug('Wallets:', beforeCounts[4]);
        logger.debug('Savings Accounts:', beforeCounts[5]);
        logger.debug('Education Content:', beforeCounts[6]);
        logger.debug('Savings Goals:', beforeCounts[7]);
        logger.debug('Savings Rules:', beforeCounts[8]);
        logger.debug('User Profiles:', beforeCounts[9]);

        // Clear all collections
        logger.debug('\nClearing collections...');
        
        await Promise.all([
            User.deleteMany({}),
            Budget.deleteMany({}),
            Transaction.deleteMany({}),
            Category.deleteMany({}),
            Wallet.deleteMany({}),
            SavingsAccount.deleteMany({}),
            Education.deleteMany({}),
            SavingsGoal.deleteMany({}),
            SavingsRule.deleteMany({}),
            UserProfile.deleteMany({})
        ]);

        // Verify deletion
        const afterCounts = await Promise.all([
            User.countDocuments(),
            Budget.countDocuments(),
            Transaction.countDocuments(),
            Category.countDocuments(),
            Wallet.countDocuments(),
            SavingsAccount.countDocuments(),
            Education.countDocuments(),
            SavingsGoal.countDocuments(),
            SavingsRule.countDocuments(),
            UserProfile.countDocuments()
        ]);

        logger.debug('\nVerification - All collections should be empty:');
        logger.debug('Users:', afterCounts[0]);
        logger.debug('Budgets:', afterCounts[1]);
        logger.debug('Transactions:', afterCounts[2]);
        logger.debug('Categories:', afterCounts[3]);
        logger.debug('Wallets:', afterCounts[4]);
        logger.debug('Savings Accounts:', afterCounts[5]);
        logger.debug('Education Content:', afterCounts[6]);
        logger.debug('Savings Goals:', afterCounts[7]);
        logger.debug('Savings Rules:', afterCounts[8]);
        logger.debug('User Profiles:', afterCounts[9]);

        const allEmpty = afterCounts.every(count => count === 0);
        if (allEmpty) {
            logger.debug('\n✅ Database cleared successfully!');
        } else {
            logger.debug('\n⚠️ Warning: Some collections may not have been fully cleared.');
        }

        // Close the connection
        await mongoose.connection.close();
        logger.debug('MongoDB connection closed.');
        
        process.exit(0);
    } catch (error) {
        logger.error('❌ Error clearing database:', error);
        // Ensure connection is closed even if error occurs
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            logger.debug('MongoDB connection closed after error.');
        }
        process.exit(1);
    }
};

// Run the clear function
clearDatabase();
