const SavingsRule = require('../models/SavingsRule');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const SavingsAccount = require('../models/SavingsAccount');

/**
 * Executes applicable savings rules when a transaction occurs.
 * @param {ObjectId} userId - ID of the user
 * @param {Object} transactionData - Created transaction data with { amount, type, walletId, ... }
 * @returns {Object} - { executed: Number, details: Array }
 */
async function executeRulesForTransaction(userId, transactionData) {
    const rules = await SavingsRule.find({ userId, active: true });
    const results = [];

    for (const rule of rules) {
        let saveAmount = 0;
        const amt = parseFloat(transactionData.amount);
        switch (rule.triggerType) {
            case 'income':
                if (transactionData.type === 'income') {
                    saveAmount = amt * (rule.savePercentage / 100);
                }
                break;
            case 'expense':
                if (transactionData.type === 'expense') {
                    saveAmount = amt * (rule.savePercentage / 100);
                }
                break;
            case 'roundUp':
                if (transactionData.type === 'expense' && rule.roundUpTransactions) {
                    saveAmount = Math.ceil(amt) - amt;
                }
                break;
            case 'budgetUnderflow':
                // Placeholder: implement budget underflow logic
                break;
            case 'scheduled':
                // Scheduled rules are handled separately
                break;
            default:
                break;
        }

        if (saveAmount > 0) {
            // Deduct from source wallet
            if (rule.sourceWalletId) {
                const wallet = await Wallet.findById(rule.sourceWalletId);
                if (wallet) {
                    wallet.balance -= saveAmount;
                    await wallet.save();
                }
            }
            // Credit to default savings account
            const savingsAccount = await SavingsAccount.findOne({ userId });
            if (savingsAccount) {
                savingsAccount.balance += saveAmount;
                await savingsAccount.save();
                // Record savings transaction
                const tx = new Transaction({
                    userId,
                    type: 'transfer',
                    amount: saveAmount,
                    fromWalletId: rule.sourceWalletId,
                    toWalletId: savingsAccount._id
                });
                await tx.save();
            }
            // Mark rule executed
            rule.lastExecuted = new Date();
            await rule.save();
            results.push({ ruleId: rule._id, saved: saveAmount });
        }
    }

    return { executed: results.length, details: results };
}

module.exports = { executeRulesForTransaction };
