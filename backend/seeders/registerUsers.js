const logger = require('../utils/logger');

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

// Models for cleanup
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

const users = [
    {
        username: 'john_doe',
        email: 'john_doe@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        phone: '+1234567890'
    },
    {
        username: 'sarah_wilson',
        email: 'sarah_wilson@example.com',
        password: 'P@ssword789!',
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: 'user',
        phone: '+1987654321'
    },
    {
        username: 'ryan_admin',
        email: 'ryan_admin@example.com',
        password: 'AdminPass123!',
        firstName: 'Ryan',
        lastName: 'Admin',
        role: 'admin',
        phone: '+1122334455'
    }
];

async function cleanDatabase() {
    try {
        logger.debug('Cleaning existing database...');
        await User.deleteMany({});
        await Budget.deleteMany({});
        await Transaction.deleteMany({});
        await Category.deleteMany({});
        await Wallet.deleteMany({});
        await SavingsAccount.deleteMany({});
        await Education.deleteMany({});
        await SavingsGoal.deleteMany({});
        await SavingsRule.deleteMany({});
        await UserProfile.deleteMany({});
        logger.debug('Database cleaned successfully!');
    } catch (error) {
        logger.error('Error cleaning database:', error);
        process.exit(1);
    }
}

async function registerUsers() {
    try {
        logger.debug('Starting user registration...');
        
        for (const userData of users) {
            try {
                const response = await fetch('http://localhost:5000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    logger.debug(`✅ Successfully registered ${userData.username}`);
                    logger.debug('Response:', data);
                } else {
                    logger.error(`❌ Failed to register ${userData.username}:`, data);
                }
            } catch (error) {
                logger.error(`❌ Failed to register ${userData.username}:`, error.message);
            }
            
            // Add a small delay between registrations
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        logger.debug('User registration completed!');
        process.exit(0);
    } catch (error) {
        logger.error('Registration script error:', error);
        process.exit(1);
    }
}

// Connect to MongoDB and run the script
mongoose
    .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/coinDrop')
    .then(async () => {
        logger.debug('Connected to MongoDB...');
        await cleanDatabase();
        await registerUsers();
    })
    .catch(error => {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    });
