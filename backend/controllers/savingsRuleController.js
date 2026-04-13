const logger = require('../utils/logger');

const mongoose = require('mongoose');
const SavingsRule = require('../models/SavingsRule');
const SavingsAccount = require('../models/SavingsAccount');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { executeRulesForTransaction } = require('../services/savingsRuleExecutor');
const { getAuthenticatedUserId } = require('../utils/authUser');

class SavingsRuleController {
    // Get all rules for a user
    static async getUserRules(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const rules = await SavingsRule.find({ userId });
            res.json(rules);
        } catch (error) {
            logger.error('Error fetching savings rules:', error);
            res.status(500).json({ error: 'Failed to fetch savings rules' });
        }
    }

    // Create a new rule
    static async createRule(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            
            const newRule = new SavingsRule({ 
                ...req.body, 
                userId 
            });
            
            await newRule.save();
            res.status(201).json(newRule);
        } catch (error) {
            logger.error('Error creating savings rule:', error);
            res.status(400).json({ error: 'Failed to create savings rule' });
        }
    }

    // Update a rule
    static async updateRule(req, res) {
        try {
            const { ruleId } = req.params;
            const userId = getAuthenticatedUserId(req);
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            
            const updatedRule = await SavingsRule.findOneAndUpdate(
                { _id: ruleId, userId },
                req.body,
                { new: true }
            );
            
            if (!updatedRule) {
                return res.status(404).json({ error: 'Savings rule not found' });
            }
            
            res.json(updatedRule);
        } catch (error) {
            logger.error('Error updating savings rule:', error);
            res.status(400).json({ error: 'Failed to update savings rule' });
        }
    }

    // Delete a rule
    static async deleteRule(req, res) {
        try {
            const { ruleId } = req.params;
            const userId = getAuthenticatedUserId(req);
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            
            const deletedRule = await SavingsRule.findOneAndDelete({ _id: ruleId, userId });
            
            if (!deletedRule) {
                return res.status(404).json({ error: 'Savings rule not found' });
            }
            
            res.json({ message: 'Savings rule deleted successfully' });
        } catch (error) {
            logger.error('Error deleting savings rule:', error);
            res.status(400).json({ error: 'Failed to delete savings rule' });
        }
    }

    // Execute rules for a transaction
    static async executeRules(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { transactionData } = req.body;
            if (!userId || !transactionData) {
                return res.status(400).json({ error: 'User ID and transactionData are required' });
            }
            const result = await executeRulesForTransaction(userId, transactionData);
            return res.json(result);
        } catch (error) {
            logger.error('Error executing savings rules:', error);
            return res.status(500).json({ error: 'Failed to execute savings rules' });
        }
    }

    // Execute all rules for a user
    static async executeAllRules(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            
            // Get all active rules
            const rules = await SavingsRule.find({ userId, active: true });
            const executedRules = [];
            
            for (const rule of rules) {
                if (rule.triggerType === 'scheduled') {
                    // Handle scheduled transfers
                    if (rule.scheduleAmount > 0 && rule.sourceWalletId) {
                        const wallet = await Wallet.findById(rule.sourceWalletId);
                        if (wallet && wallet.balance >= rule.scheduleAmount) {
                            // Find target savings account (use first one or specific one if specified)
                            const savingsAccount = await SavingsAccount.findOne({ userId });
                            if (savingsAccount) {
                                // Deduct from wallet
                                wallet.balance -= rule.scheduleAmount;
                                await wallet.save();
                                
                                // Add to savings account
                                savingsAccount.balance += rule.scheduleAmount;
                                await savingsAccount.save();
                                
                                // Create transaction
                                const transaction = new Transaction({
                                    userId,
                                    type: 'transfer',
                                    amount: rule.scheduleAmount,
                                    fromWalletId: rule.sourceWalletId,
                                    toWalletId: savingsAccount._id,
                                    description: `Scheduled transfer from rule: ${rule.name}`
                                });
                                await transaction.save();
                                
                                // Update last executed
                                rule.lastExecuted = new Date();
                                await rule.save();
                                
                                executedRules.push({
                                    ruleId: rule._id,
                                    name: rule.name,
                                    amount: rule.scheduleAmount
                                });
                            }
                        }
                    }
                }
            }
            
            res.json({ 
                executedRules: executedRules.length, 
                details: executedRules 
            });
        } catch (error) {
            logger.error('Error executing all savings rules:', error);
            res.status(500).json({ error: 'Failed to execute savings rules' });
        }
    }

    // Get rule statistics
    static async getRuleStats(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            
            // Get all rules for the user
            const rules = await SavingsRule.find({ userId });
            
            // Calculate basic statistics
            const stats = {
                totalRules: rules.length,
                activeRules: rules.filter(rule => rule.active).length,
                rulesByType: {}
            };
            
            // Count rules by type
            rules.forEach(rule => {
                if (!stats.rulesByType[rule.triggerType]) {
                    stats.rulesByType[rule.triggerType] = 0;
                }
                stats.rulesByType[rule.triggerType]++;
            });
            
            res.json(stats);
        } catch (error) {
            logger.error('Error fetching rule statistics:', error);
            res.status(500).json({ error: 'Failed to fetch rule statistics' });
        }
    }

    // Setup auto-transfer
    static async setupAutoTransfer(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { sourceWalletId, targetAccountId, amount, frequency, startDate } = req.body;
            
            if (!userId || !sourceWalletId || !targetAccountId || !amount) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            // Validate source wallet
            const wallet = await Wallet.findById(sourceWalletId);
            if (!wallet || wallet.userId.toString() !== userId) {
                return res.status(404).json({ error: 'Source wallet not found' });
            }
            
            // Validate target savings account
            const savingsAccount = await SavingsAccount.findById(targetAccountId);
            if (!savingsAccount || savingsAccount.userId.toString() !== userId) {
                return res.status(404).json({ error: 'Target savings account not found' });
            }
            
            // Create auto-transfer rule
            const autoTransferRule = new SavingsRule({
                userId,
                goalId: savingsAccount._id, // Use savings account as goal
                name: 'Auto-Transfer Rule',
                triggerType: 'scheduled',
                active: true,
                scheduleFrequency: frequency,
                scheduleAmount: amount,
                sourceWalletId,
                lastExecuted: null
            });
            
            await autoTransferRule.save();
            res.status(201).json(autoTransferRule);
        } catch (error) {
            logger.error('Error setting up auto-transfer:', error);
            res.status(500).json({ error: 'Failed to setup auto-transfer' });
        }
    }

    // Update goal-based savings
    static async updateGoalBasedSavings(req, res) {
        try {
            const userId = getAuthenticatedUserId(req);
            const { goalId } = req.params;
            const { autoSaveEnabled, targetAmount, deadline } = req.body;
            
            if (!userId || !goalId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            // Find or create goal-based savings rule
            let rule = await SavingsRule.findOne({ userId, goalId });
            
            if (!rule) {
                rule = new SavingsRule({
                    userId,
                    goalId,
                    name: 'Goal-Based Savings Rule',
                    triggerType: 'income',
                    active: autoSaveEnabled,
                    savePercentage: 10, // Default 10%
                    savingsPriority: 'high'
                });
            } else {
                rule.active = autoSaveEnabled;
                if (autoSaveEnabled) {
                    rule.savingsPriority = 'high';
                }
            }
            
            await rule.save();
            res.json(rule);
        } catch (error) {
            logger.error('Error updating goal-based savings:', error);
            res.status(500).json({ error: 'Failed to update goal-based savings' });
        }
    }
}

module.exports = SavingsRuleController;
