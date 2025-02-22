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
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected successfully to MongoDB');

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

        console.log('\nCurrent collection counts:');
        console.log('Users:', beforeCounts[0]);
        console.log('Budgets:', beforeCounts[1]);
        console.log('Transactions:', beforeCounts[2]);
        console.log('Categories:', beforeCounts[3]);
        console.log('Wallets:', beforeCounts[4]);
        console.log('Savings Accounts:', beforeCounts[5]);
        console.log('Education Content:', beforeCounts[6]);
        console.log('Savings Goals:', beforeCounts[7]);
        console.log('Savings Rules:', beforeCounts[8]);
        console.log('User Profiles:', beforeCounts[9]);

        // Clear all collections
        console.log('\nClearing collections...');
        
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

        console.log('\nVerification - All collections should be empty:');
        console.log('Users:', afterCounts[0]);
        console.log('Budgets:', afterCounts[1]);
        console.log('Transactions:', afterCounts[2]);
        console.log('Categories:', afterCounts[3]);
        console.log('Wallets:', afterCounts[4]);
        console.log('Savings Accounts:', afterCounts[5]);
        console.log('Education Content:', afterCounts[6]);
        console.log('Savings Goals:', afterCounts[7]);
        console.log('Savings Rules:', afterCounts[8]);
        console.log('User Profiles:', afterCounts[9]);

        const allEmpty = afterCounts.every(count => count === 0);
        if (allEmpty) {
            console.log('\n✅ Database cleared successfully!');
        } else {
            console.log('\n⚠️ Warning: Some collections may not have been fully cleared.');
        }

        // Close the connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error clearing database:', error);
        // Ensure connection is closed even if error occurs
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('MongoDB connection closed after error.');
        }
        process.exit(1);
    }
};

// Run the clear function
clearDatabase();
