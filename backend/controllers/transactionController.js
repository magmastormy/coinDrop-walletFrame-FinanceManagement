const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

class TransactionController {
    // Create a new transaction
    static async createTransaction(req, res) {
        try {
            const transactionData = {
                ...req.body,
                userId: req.user._id // Automatically set user ID from authenticated user
            };

            const transaction = new Transaction(transactionData);
            await transaction.save();

            res.status(201).json({
                message: 'Transaction created successfully',
                transaction
            });
        } catch (error) {
            res.status(400).json({
                error: 'Transaction creation failed',
                details: error.message
            });
        }
    }

    // Get all transactions for a user
    static async getUserTransactions(req, res) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                type, 
                category, 
                startDate, 
                endDate 
            } = req.query;

            const filter = { userId: req.user._id };

            // Optional filters
            if (type) filter.type = type;
            if (category) filter.category = category;
            
            if (startDate && endDate) {
                filter.date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            const transactions = await Transaction.find(filter)
                .sort({ date: -1 })
                .skip((page - 1) * limit)
                .limit(Number(limit));

            const total = await Transaction.countDocuments(filter);

            res.json({
                transactions,
                totalPages: Math.ceil(total / limit),
                currentPage: page
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve transactions',
                details: error.message
            });
        }
    }

    // Update a transaction
    static async updateTransaction(req, res) {
        try {
            const { id } = req.params;

            // Ensure transaction belongs to the user
            const transaction = await Transaction.findOneAndUpdate(
                { _id: id, userId: req.user._id },
                req.body,
                { new: true, runValidators: true }
            );

            if (!transaction) {
                return res.status(404).json({ 
                    error: 'Transaction not found or unauthorized' 
                });
            }

            res.json({
                message: 'Transaction updated successfully',
                transaction
            });
        } catch (error) {
            res.status(400).json({
                error: 'Transaction update failed',
                details: error.message
            });
        }
    }

    // Delete a transaction
    static async deleteTransaction(req, res) {
        try {
            const { id } = req.params;

            const transaction = await Transaction.findOneAndDelete({
                _id: id,
                userId: req.user._id
            });

            if (!transaction) {
                return res.status(404).json({ 
                    error: 'Transaction not found or unauthorized' 
                });
            }

            res.json({
                message: 'Transaction deleted successfully',
                transaction
            });
        } catch (error) {
            res.status(500).json({
                error: 'Transaction deletion failed',
                details: error.message
            });
        }
    }

    // Get transaction statistics
    static async getTransactionStats(req, res) {
        try {
            const userId = req.user._id;

            const stats = await Transaction.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(userId) } },
                {
                    $group: {
                        _id: '$type',
                        totalAmount: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]);

            res.json({ stats });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retrieve transaction statistics',
                details: error.message
            });
        }
    }
}

module.exports = TransactionController;
