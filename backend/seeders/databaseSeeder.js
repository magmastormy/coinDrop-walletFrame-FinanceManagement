const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Sample data
const users = [
    {
        username: 'john_doe',
        email: 'john_doe@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user'
    },
    {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'Password123!',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'user'
    },
    {
        username: 'michael_johnson',
        email: 'michael@sample.com',
        password: 'SecurePass456@',
        firstName: 'Michael',
        lastName: 'Johnson',
        role: 'user'
    },
    {
        username: 'sarah_wilson',
        email: 'sarah_wilson@example.com',
        password: 'P@ssword789!',
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: 'user'
    },
    {
        username: 'david_brown',
        email: 'david@demo.com',
        password: 'BrownDavid123#',
        firstName: 'David',
        lastName: 'Brown',
        role: 'user'
    },
    {
        username: 'emily_davis',
        email: 'emily@domain.com',
        password: 'EmilyPass123$',
        firstName: 'Emily',
        lastName: 'Davis',
        role: 'user'
    },
    {
        username: 'chris_miller',
        email: 'chris@site.com',
        password: 'MillerChris456!',
        firstName: 'Chris',
        lastName: 'Miller',
        role: 'user'
    },
    {
        username: 'jessica_taylor',
        email: 'jessica@web.com',
        password: 'TaylorJessi789@',
        firstName: 'Jessica',
        lastName: 'Taylor',
        role: 'user'
    },
    {
        username: 'matthew_anderson',
        email: 'matthew@example.org',
        password: 'MattPass123!',
        firstName: 'Matthew',
        lastName: 'Anderson',
        role: 'user'
    },
    {
        username: 'laura_martinez',
        email: 'laura@mail.com',
        password: 'Martinez123!',
        firstName: 'Laura',
        lastName: 'Martinez',
        role: 'user'
    },
    {
        username: 'daniel_thomas',
        email: 'daniel@service.com',
        password: 'DThomas456#',
        firstName: 'Daniel',
        lastName: 'Thomas',
        role: 'user'
    },
    {
        username: 'karen_jackson',
        email: 'karen@network.com',
        password: 'JacksonPass789!',
        firstName: 'Karen',
        lastName: 'Jackson',
        role: 'user'
    },
    {
        username: 'ryan_white',
        email: 'ryan@cloud.com',
        password: 'WhiteRyan123@',
        firstName: 'Ryan',
        lastName: 'White',
        role: 'admin'
    },
    {
        username: 'amanda_harris',
        email: 'amanda@online.com',
        password: 'HarrisAmanda456!',
        firstName: 'Amanda',
        lastName: 'Harris',
        role: 'user'
    },
    {
        username: 'olivia_garcia',
        email: 'olivia@app.com',
        password: 'OliVia789$Secure',
        firstName: 'Olivia',
        lastName: 'Garcia',
        role: 'user'
    },
    {
        username: 'james_lee',
        email: 'james@service.org',
        password: 'J@mesLee2023!',
        firstName: 'James',
        lastName: 'Lee',
        role: 'admin'
    },
    {
        username: 'sophia_clark',
        email: 'sophia@platform.net',
        password: 'S0phiaC!ark99',
        firstName: 'Sophia',
        lastName: 'Clark',
        role: 'user'
    },
    {
        username: 'ethan_rodriguez',
        email: 'ethan@digital.co',
        password: 'RodriguezE#456',
        firstName: 'Ethan',
        lastName: 'Rodriguez',
        role: 'user'
    },
    {
        username: 'ava_hernandez',
        email: 'ava@cloudservice.io',
        password: 'AvaHern@ndez123',
        firstName: 'Ava',
        lastName: 'Hernandez',
        role: 'user'
    },
    {
        username: 'noah_king',
        email: 'noah@techgrid.com',
        password: 'K1ngN0ah!2024',
        firstName: 'Noah',
        lastName: 'King',
        role: 'user'
    },
    {
        username: 'mia_flores',
        email: 'mia@devhub.org',
        password: 'MiaFl0r3s$',
        firstName: 'Mia',
        lastName: 'Flores',
        role: 'user'
    },
    {
        username: 'liam_green',
        email: 'liam@innovate.dev',
        password: 'GreenL1am!Pass',
        firstName: 'Liam',
        lastName: 'Green',
        role: 'user'
    },
    {
        username: 'isabella_carter',
        email: 'bella@nexus.co',
        password: 'CarterIzzy789#',
        firstName: 'Isabella',
        lastName: 'Carter',
        role: 'user'
    },
    {
        username: 'lucas_phillips',
        email: 'lucas@codebase.io',
        password: 'LucasPh!ll1ps',
        firstName: 'Lucas',
        lastName: 'Phillips',
        role: 'user'
    },
    {
        username: 'emma_baker',
        email: 'emma@webworks.tech',
        password: 'BakerEmma123$',
        firstName: 'Emma',
        lastName: 'Baker',
        role: 'user'
    },
    {
        username: 'oliver_nguyen',
        email: 'oliver@dataflow.com',
        password: 'Nguyen0l!ver',
        firstName: 'Oliver',
        lastName: 'Nguyen',
        role: 'admin'
    }
];

const categories = [
    { 
        name: 'Food & Dining',
        description: 'Expenses related to food and dining',
        isRoot: true,
        budgetTypes: ['expense'],
        icon: '🍽️',
        color: '#FF5733'
    },
    { 
        name: 'Transportation',
        description: 'Transportation related expenses',
        isRoot: true,
        budgetTypes: ['expense'],
        icon: '🚗',
        color: '#33FF57'
    },
    { 
        name: 'Shopping',
        description: 'Shopping and retail expenses',
        isRoot: true,
        budgetTypes: ['expense'],
        icon: '🛍️',
        color: '#3357FF'
    },
    { 
        name: 'Bills & Utilities',
        description: 'Regular bills and utility payments',
        isRoot: true,
        budgetTypes: ['expense'],
        icon: '📄',
        color: '#FF33F6'
    },
    { 
        name: 'Salary',
        description: 'Regular income from employment',
        isRoot: true,
        budgetTypes: ['income'],
        icon: '💰',
        color: '#33FFF6'
    },
    { 
        name: 'Investments',
        description: 'Investment related income',
        isRoot: true,
        budgetTypes: ['income'],
        icon: '📈',
        color: '#F6FF33'
    },
    { 
        name: 'Health & Fitness',
        description: 'Expenses related to health and fitness activities',
        isRoot: true,
        budgetTypes: ['expense'],
        icon: '🏋️‍♂️',
        color: '#FF8C00'
    },
    { 
        name: 'Entertainment',
        description: 'Expenses for entertainment and leisure activities',
        isRoot: true,
        budgetTypes: ['expense'],
        icon: '🎉',
        color: '#FF1493'
    },
    { 
        name: 'Travel',
        description: 'Expenses related to travel and vacations',
        isRoot: true,
        budgetTypes: ['expense'],
        icon: '✈️',
        color: '#1E90FF'
    },
    { 
        name: 'Education',
        description: 'Expenses for education and learning',
        isRoot: true,
        budgetTypes: ['expense'],
        icon: '📚',
        color: '#FFD700'
    },
    { 
        name: 'Gifts & Donations',
        description: 'Expenses for gifts and charitable donations',
        isRoot: true,
        budgetTypes: ['expense'],
        icon: '🎁',
        color: '#FF69B4'
    },
    { 
        name: 'Freelance Income',
        description: 'Income from freelance work and side jobs',
        isRoot: true,
        budgetTypes: ['income'],
        icon: '🖥️',
        color: '#32CD32'
    },
    { 
        name: 'Rental Income',
        description: 'Income from rental properties',
        isRoot: true,
        budgetTypes: ['income'],
        icon: '🏠',
        color: '#8A2BE2'
    }
];

const generateBudgets = (userId, categoryIds) => {
    const budgets = [];
    const periods = ['monthly', 'weekly'];
    const types = ['expense', 'income'];

    categoryIds.forEach((categoryId, index) => {
        budgets.push({
            userId,
            name: `Budget ${index + 1}`,
            amount: Math.floor(Math.random() * 5000) + 1000,
            type: types[index % 2],
            period: periods[index % 2],
            startDate: new Date(),
            category: categoryId,
            spent: 0,
            committed: 0
        });
    });

    return budgets;
};

const generateWallets = (userId) => {
    return [
        {
            userId,
            name: 'Main Wallet',
            balance: Math.floor(Math.random() * 10000) + 5000,
            currency: 'USD',
            isDefault: true,
            description: 'Primary spending account'
        },
        {
            userId,
            name: 'Travel Fund',
            balance: Math.floor(Math.random() * 5000) + 2000,
            currency: 'USD',
            isDefault: false,
            description: 'Dedicated wallet for travel expenses'
        },
        {
            userId,
            name: 'Emergency Fund',
            balance: Math.floor(Math.random() * 15000) + 10000,
            currency: 'USD',
            isDefault: false,
            description: 'Emergency funds and unexpected expenses'
        },
        {
            userId,
            name: 'Business Expenses',
            balance: Math.floor(Math.random() * 8000) + 3000,
            currency: 'USD',
            isDefault: false,
            description: 'Business-related expenses and income'
        }
    ];
};

const generateSavingsAccounts = (userId) => {
    return [
        {
            userId,
            name: 'High-Yield Savings',
            balance: Math.floor(Math.random() * 20000) + 10000,
            currency: 'USD',
            interestRate: 4.5,
            description: 'High-interest savings account',
            isDefault: true,
            automation: {
                type: 'percentage',
                frequency: 'monthly',
                amount: 15, // 15% of income
                enabled: true,
                lastRun: new Date(),
                nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        },
        {
            userId,
            name: 'Retirement Fund',
            balance: Math.floor(Math.random() * 50000) + 25000,
            currency: 'USD',
            interestRate: 6.0,
            description: 'Long-term retirement savings',
            isDefault: false,
            automation: {
                type: 'fixed',
                frequency: 'monthly',
                amount: 1000, // Fixed $1000 monthly
                enabled: true,
                lastRun: new Date(),
                nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        },
        {
            userId,
            name: 'Vacation Savings',
            balance: Math.floor(Math.random() * 8000) + 2000,
            currency: 'USD',
            interestRate: 3.0,
            description: 'Savings for vacations and travel',
            isDefault: false,
            automation: {
                type: 'percentage',
                frequency: 'monthly',
                amount: 5, // 5% of income
                enabled: true,
                lastRun: new Date(),
                nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        },
        {
            userId,
            name: 'Education Fund',
            balance: Math.floor(Math.random() * 15000) + 5000,
            currency: 'USD',
            interestRate: 3.5,
            description: 'Savings for education and skill development',
            isDefault: false,
            automation: {
                type: 'fixed',
                frequency: 'monthly',
                amount: 500, // Fixed $500 monthly
                enabled: true,
                lastRun: new Date(),
                nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        }
    ];
};

const generateTransactions = (userId, categoryIds, budgetIds, walletId, savingsAccountId) => {
    const transactions = [];
    const types = ['income', 'expense'];
    const descriptions = [
        'Grocery shopping', 'Restaurant bill', 'Gas', 'Movie tickets',
        'Monthly salary', 'Freelance payment', 'Utility bill', 'Shopping'
    ];

    // Generate 40 transactions per user
    for (let i = 0; i < 40; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const categoryIndex = Math.floor(Math.random() * categoryIds.length);
        const budgetIndex = Math.floor(Math.random() * budgetIds.length);

        transactions.push({
            userId,
            type,
            amount: Math.floor(Math.random() * 1000) + 100,
            category: categoryIds[categoryIndex],
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            budgetId: budgetIds[budgetIndex],
            walletId,
            savingsAccountId,
            affectsBudget: true
        });
    }

    return transactions;
};

const generateEducationContent = () => {
    const titles = [
        'Understanding Emergency Funds',
        'Basics of Stock Market Investing',
        'How to Create a Budget That Works',
        'Smart Saving Strategies for Millennials',
        'Cryptocurrency 101: A Beginner\'s Guide',
        'Real Estate Investment Fundamentals',
        'Retirement Planning in Your 30s',
        'Tax-Saving Investment Options',
        'Debt Management Strategies',
        'Building Wealth Through Index Funds'
    ];

    const details = [
        '# Understanding Emergency Funds\n\nAn emergency fund is your financial safety net...',
        '# Stock Market Basics\n\nThe stock market is a place where shares of publicly traded companies...',
        '# Effective Budgeting\n\nA budget is a financial plan that helps you track income and expenses...',
        '# Smart Saving Tips\n\nSaving money doesn\'t have to be difficult. Here are some strategies...',
        '# Crypto Fundamentals\n\nCryptocurrency is a digital or virtual form of currency...'
    ];

    return {
        title: titles[Math.floor(Math.random() * titles.length)],
        details: details[Math.floor(Math.random() * details.length)],
        contentType: 'markdown',
        likes: [],
        comments: []
    };
};

const generateSavingsGoals = (userId) => {
    const goals = [
        {
            name: 'Dream Home Down Payment',
            targetAmount: 50000,
            currentAmount: Math.floor(Math.random() * 25000),
            deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            description: 'Saving for a down payment on my dream home'
        },
        {
            name: 'World Tour Fund',
            targetAmount: 15000,
            currentAmount: Math.floor(Math.random() * 7500),
            deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            description: 'Saving for a 3-month world tour'
        },
        {
            name: 'New Car Fund',
            targetAmount: 30000,
            currentAmount: Math.floor(Math.random() * 15000),
            deadline: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
            description: 'Saving for a new electric vehicle'
        }
    ];

    return goals.map(goal => ({
        ...goal,
        userId
    }));
};

const generateSavingsRules = (userId, goalIds) => {
    return goalIds.map(goalId => ({
        userId,
        goalId,
        saveBudgetUnderflow: Math.random() > 0.5,
        savePercentage: Math.floor(Math.random() * 30) + 5,
        roundUpTransactions: Math.random() > 0.5,
        savingsPriority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        lastExecuted: new Date()
    }));
};

const generateUserProfile = (userId, username) => {
    const interests = [
        'investing',
        'budgeting',
        'saving',
        'crypto',
        'stocks',
        'real-estate',
        'retirement',
        'taxes',
        'insurance'
    ];

    // Randomly select 3-5 interests
    const selectedInterests = interests
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 3);

    return {
        user: userId,
        username,
        bio: `Financial enthusiast passionate about ${selectedInterests.join(', ')}`,
        profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        coverPhoto: `https://picsum.photos/seed/${username}/1500/500`,
        interests: selectedInterests,
        followers: [],
        following: [],
        posts: []
    };
};

const seedDatabase = async () => {
    try {
        // Clear existing data
/**
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
 
 **/
        // Create users and their related data
        for (let i = 0; i < users.length; i++) {
            const userData = users[i];
            
            // Create user with plain password (no hashing)
            const user = await User.create({
                ...userData,
                isVerified: true // Add verification status
            });

            // Create user profile
            await UserProfile.create(generateUserProfile(user._id, userData.username));

            // Create categories for user with unique names
            const userCategories = categories.map(cat => ({
                ...cat,
                name: `${cat.name} (${userData.username})`,
                userId: user._id
            }));
            const createdCategories = await Category.insertMany(userCategories);
            const categoryIds = createdCategories.map(cat => cat._id);

            // Create multiple wallets
            const wallets = generateWallets(user._id);
            const createdWallets = await Wallet.insertMany(wallets);

            // Create multiple savings accounts
            const savingsAccounts = generateSavingsAccounts(user._id);
            const createdSavingsAccounts = await SavingsAccount.insertMany(savingsAccounts);

            // Create savings goals
            const savingsGoals = generateSavingsGoals(user._id);
            const createdSavingsGoals = await SavingsGoal.insertMany(savingsGoals);
            const savingsGoalIds = createdSavingsGoals.map(goal => goal._id);

            // Create savings rules
            const savingsRules = generateSavingsRules(user._id, savingsGoalIds);
            await SavingsRule.insertMany(savingsRules);

            // Create education content (only for admin users)
            if (userData.role === 'admin') {
                for (let j = 0; j < 3; j++) {
                    const educationContent = generateEducationContent();
                    await Education.create({
                        ...educationContent,
                        author: user._id
                    });
                }
            }

            // Create budgets for user
            const budgets = generateBudgets(user._id, categoryIds);
            const createdBudgets = await Budget.insertMany(budgets);
            const budgetIds = createdBudgets.map(budget => budget._id);

            // Create transactions for user
            const transactions = generateTransactions(
                user._id, 
                categoryIds, 
                budgetIds, 
                createdWallets[Math.floor(Math.random() * createdWallets.length)]._id,
                createdSavingsAccounts[Math.floor(Math.random() * createdSavingsAccounts.length)]._id
            );
            await Transaction.insertMany(transactions);
        }

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

// Connect to MongoDB and run seeder
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('MongoDB Atlas connected...');
        seedDatabase();
    })
    .catch(err => {
        console.error('MongoDB Atlas connection error:', err);
        process.exit(1);
    });
