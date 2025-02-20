require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { up: categoryBudgetIntegration } = require('./20250218_category_budget_integration');
const connectDB = require('../config/db');

async function runMigrations() {
    try {
        console.log('Starting migrations...');

        // Connect to MongoDB using existing configuration
        await connectDB();
        console.log('Database connected');

        console.log('Running category-budget integration migration...');
        await categoryBudgetIntegration();

        console.log('All migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigrations();
