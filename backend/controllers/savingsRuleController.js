const mongoose = require('mongoose');
const SavingsRule = require('../models/SavingsRule');
const { executeRulesForTransaction } = require('../services/savingsRuleExecutor');

class SavingsRuleController {
    // Get all rules for a user
    static async getUserRules(req, res) {
        try {
            const { userId } = req.params;
            const rules = await SavingsRule.find({ userId });
            res.json(rules);
        } catch (error) {
            console.error('Error fetching savings rules:', error);
            res.status(500).json({ error: 'Failed to fetch savings rules' });
        }
    }

    // Create a new rule
    static async createRule(req, res) {
        try {
            // Log the request body and user for debugging
            console.log('Create rule request body:', req.body);
            console.log('User from request:', req.user);
            
            const userId = req.user?._id || req.body.userId || req.query.userId;
            
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
            console.error('Error creating savings rule:', error);
            res.status(400).json({ error: 'Failed to create savings rule' });
        }
    }

    // Update a rule
    static async updateRule(req, res) {
        try {
            const { ruleId } = req.params;
            const userId = req.user?._id || req.body.userId || req.query.userId;
            
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
            console.error('Error updating savings rule:', error);
            res.status(400).json({ error: 'Failed to update savings rule' });
        }
    }

    // Delete a rule
    static async deleteRule(req, res) {
        try {
            const { ruleId } = req.params;
            const userId = req.user?._id || req.body.userId || req.query.userId;
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            
            const deletedRule = await SavingsRule.findOneAndDelete({ _id: ruleId, userId });
            
            if (!deletedRule) {
                return res.status(404).json({ error: 'Savings rule not found' });
            }
            
            res.json({ message: 'Savings rule deleted successfully' });
        } catch (error) {
            console.error('Error deleting savings rule:', error);
            res.status(400).json({ error: 'Failed to delete savings rule' });
        }
    }

    // Execute rules for a transaction
    static async executeRules(req, res) {
        try {
            const userId = req.user?._id || req.body.userId || req.query.userId;
            const { transactionData } = req.body;
            if (!userId || !transactionData) {
                return res.status(400).json({ error: 'User ID and transactionData are required' });
            }
            const result = await executeRulesForTransaction(userId, transactionData);
            return res.json(result);
        } catch (error) {
            console.error('Error executing savings rules:', error);
            return res.status(500).json({ error: 'Failed to execute savings rules' });
        }
    }

    // Get rule statistics
    static async getRuleStats(req, res) {
        try {
            const { userId } = req.params;
            
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
            console.error('Error fetching rule statistics:', error);
            res.status(500).json({ error: 'Failed to fetch rule statistics' });
        }
    }
}

module.exports = SavingsRuleController;
