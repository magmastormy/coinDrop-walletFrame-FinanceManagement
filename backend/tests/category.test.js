const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const { setupTestDB, generateAuthToken } = require('./testUtils');

describe('Category Auto-Categorization', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        await setupTestDB();
        userId = new mongoose.Types.ObjectId();
        authToken = generateAuthToken(userId);
    });

    beforeEach(async () => {
        await Category.deleteMany({});
        await Transaction.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('GET /api/categories/patterns', () => {
        it('should return category patterns for user', async () => {
            // Create test categories and transactions
            const category = await Category.create({
                name: 'Groceries',
                userId,
                budgetType: 'expense'
            });

            await Transaction.create({
                description: 'Walmart Groceries',
                amount: 50,
                category: category._id,
                userId
            });

            const response = await request(app)
                .get('/api/categories/patterns')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('Walmart Groceries');
            expect(response.body['Walmart Groceries'].name).toBe('Groceries');
        });
    });

    describe('POST /api/categories/suggest', () => {
        it('should suggest category based on description match', async () => {
            const category = await Category.create({
                name: 'Dining',
                userId,
                budgetType: 'expense'
            });

            await Transaction.create({
                description: 'McDonalds Restaurant',
                amount: 15,
                category: category._id,
                userId
            });

            const response = await request(app)
                .post('/api/categories/suggest')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    description: 'McDonalds Lunch',
                    amount: 12,
                    merchant: 'McDonalds'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('categoryId');
            expect(response.body.name).toBe('Dining');
            expect(response.body.confidence).toBeGreaterThan(0.5);
        });

        it('should suggest category based on amount similarity', async () => {
            const category = await Category.create({
                name: 'Rent',
                userId,
                budgetType: 'expense'
            });

            await Transaction.create({
                description: 'Monthly Rent',
                amount: 1000,
                category: category._id,
                userId
            });

            const response = await request(app)
                .post('/api/categories/suggest')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    description: 'Apartment Payment',
                    amount: 1000,
                    merchant: 'Property Management'
                });

            expect(response.status).toBe(200);
            expect(response.body.name).toBe('Rent');
            expect(response.body.confidence).toBeGreaterThan(0.6);
        });
    });

    describe('POST /api/categories/train', () => {
        it('should train category model with new transactions', async () => {
            const category = await Category.create({
                name: 'Entertainment',
                userId,
                budgetType: 'expense'
            });

            const response = await request(app)
                .post('/api/categories/train')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    transactions: [{
                        description: 'Netflix Subscription',
                        amount: 15,
                        category: category._id
                    }]
                });

            expect(response.status).toBe(200);
            
            const updatedCategory = await Category.findById(category._id);
            expect(updatedCategory.patterns).toContainEqual(
                expect.objectContaining({
                    pattern: 'Netflix Subscription'
                })
            );
        });
    });

    describe('POST /api/categories/batch-categorize', () => {
        it('should categorize multiple transactions', async () => {
            const groceryCategory = await Category.create({
                name: 'Groceries',
                userId,
                budgetType: 'expense'
            });

            await Transaction.create({
                description: 'Walmart Groceries',
                amount: 50,
                category: groceryCategory._id,
                userId
            });

            const response = await request(app)
                .post('/api/categories/batch-categorize')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    transactions: [
                        {
                            description: 'Walmart Shopping',
                            amount: 45,
                            merchant: 'Walmart'
                        },
                        {
                            description: 'Random Store',
                            amount: 100,
                            merchant: 'Unknown'
                        }
                    ]
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0].suggestedCategory).toBeTruthy();
            expect(response.body[0].suggestedCategory.name).toBe('Groceries');
        });
    });
});
