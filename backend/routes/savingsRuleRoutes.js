const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SavingsRule = require('../models/SavingsRule');
const { check, validationResult } = require('express-validator');

// @route   POST api/savings-rules
// @desc    Create a new savings rule
// @access  Private
router.post('/', [auth, [
    check('goalId', 'Goal ID is required').not().isEmpty(),
    check('saveBudgetUnderflow', 'Save budget underflow must be a boolean').isBoolean(),
    check('savePercentage', 'Save percentage must be a number between 0 and 50').isFloat({ min: 0, max: 50 }),
    check('roundUpTransactions', 'Round up transactions must be a boolean').isBoolean(),
    check('savingsPriority', 'Savings priority must be low, medium, or high').isIn(['low', 'medium', 'high'])
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const newRule = new SavingsRule({
            userId: req.user.id,
            ...req.body
        });

        const rule = await newRule.save();
        res.json(rule);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/savings-rules/user/:userId
// @desc    Get all rules for a user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const rules = await SavingsRule.find({ userId: req.params.userId });
        res.json(rules);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/savings-rules/:id
// @desc    Update a rule
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        let rule = await SavingsRule.findById(req.params.id);
        
        if (!rule) {
            return res.status(404).json({ msg: 'Rule not found' });
        }

        // Make sure user owns rule
        if (rule.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        rule = await SavingsRule.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        res.json(rule);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/savings-rules/:id
// @desc    Delete a rule
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const rule = await SavingsRule.findById(req.params.id);
        
        if (!rule) {
            return res.status(404).json({ msg: 'Rule not found' });
        }

        // Make sure user owns rule
        if (rule.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await rule.remove();
        res.json({ msg: 'Rule removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/savings-rules/execute
// @desc    Execute savings rules for a transaction
// @access  Private
router.post('/execute', auth, async (req, res) => {
    try {
        const { transactionAmount, transactionType, sourceId } = req.body;
        const rules = await SavingsRule.find({ userId: req.user.id })
            .sort({ savingsPriority: -1 }); // Execute high priority rules first

        const savingsActions = [];

        for (const rule of rules) {
            // Calculate savings based on rules
            let savingsAmount = 0;

            // Round up transactions
            if (rule.roundUpTransactions && transactionType === 'expense') {
                const roundUpAmount = Math.ceil(transactionAmount) - transactionAmount;
                if (roundUpAmount > 0) {
                    savingsActions.push({
                        goalId: rule.goalId,
                        amount: roundUpAmount,
                        type: 'roundUp'
                    });
                }
            }

            // Save percentage of income
            if (rule.savePercentage > 0 && transactionType === 'income') {
                savingsAmount = (transactionAmount * rule.savePercentage) / 100;
                if (savingsAmount > 0) {
                    savingsActions.push({
                        goalId: rule.goalId,
                        amount: savingsAmount,
                        type: 'percentage'
                    });
                }
            }
        }

        res.json(savingsActions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
