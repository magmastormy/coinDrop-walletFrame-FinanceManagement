const mongoose = require('mongoose');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

async function up() {
    try {
        // 1. Create default root categories
        const defaultCategories = [
            {
                name: 'Income',
                budgetTypes: ['income'],
                icon: 'money-bill-wave',
                color: '#4CAF50'
            },
            {
                name: 'Expenses',
                budgetTypes: ['expense'],
                icon: 'shopping-cart',
                color: '#F44336'
            },
            {
                name: 'Savings',
                budgetTypes: ['savings'],
                icon: 'piggy-bank',
                color: '#2196F3'
            }
        ];

        // 2. Migrate existing transactions
        const transactions = await Transaction.find({});
        for (const transaction of transactions) {
            // Find or create category based on existing category string
            if (transaction.category && typeof transaction.category === 'string') {
                let category = await Category.findOne({ 
                    userId: transaction.userId,
                    name: transaction.category
                });

                if (!category) {
                    // Determine parent category based on transaction type
                    const parentCategory = await Category.findOne({
                        userId: transaction.userId,
                        name: transaction.type === 'income' ? 'Income' : 
                              transaction.type === 'expense' ? 'Expenses' : 'Savings'
                    });

                    category = await Category.create({
                        userId: transaction.userId,
                        name: transaction.category,
                        parentId: parentCategory?._id,
                        budgetTypes: [transaction.type],
                        icon: 'tag',
                        color: '#757575'
                    });
                }

                // Update transaction with category reference
                transaction.category = category._id;
                if (transaction.subcategory) {
                    let subcategory = await Category.findOne({
                        userId: transaction.userId,
                        name: transaction.subcategory,
                        parentId: category._id
                    });

                    if (!subcategory) {
                        subcategory = await Category.create({
                            userId: transaction.userId,
                            name: transaction.subcategory,
                            parentId: category._id,
                            budgetTypes: [transaction.type],
                            icon: 'tag',
                            color: '#757575'
                        });
                    }
                    transaction.subcategory = subcategory._id;
                }
                await transaction.save();
            }
        }

        // 3. Update budgets with category references
        const budgets = await Budget.find({});
        for (const budget of budgets) {
            if (budget.categoryId && typeof budget.categoryId === 'string') {
                const category = await Category.findOne({
                    userId: budget.userId,
                    name: budget.categoryId
                });

                if (category) {
                    budget.categoryId = category._id;
                    await budget.save();
                }
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

async function down() {
    try {
        // Revert categories to strings in transactions
        const transactions = await Transaction.find({
            category: { $type: 'objectId' }
        });

        for (const transaction of transactions) {
            const category = await Category.findById(transaction.category);
            const subcategory = transaction.subcategory ? 
                await Category.findById(transaction.subcategory) : null;

            transaction.category = category?.name || 'Uncategorized';
            transaction.subcategory = subcategory?.name || '';
            await transaction.save();
        }

        // Revert category references in budgets
        const budgets = await Budget.find({
            categoryId: { $type: 'objectId' }
        });

        for (const budget of budgets) {
            const category = await Category.findById(budget.categoryId);
            budget.categoryId = category?.name || 'Uncategorized';
            await budget.save();
        }

        // Remove all categories
        await Category.deleteMany({});

        console.log('Rollback completed successfully');
    } catch (error) {
        console.error('Rollback failed:', error);
        throw error;
    }
}

module.exports = { up, down };
