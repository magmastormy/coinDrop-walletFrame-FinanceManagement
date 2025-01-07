const SavingsAccount = require('../models/SavingsAccount');
const Wallet = require('../models/Wallet');

class SavingsAccountController {
    static async createSavingsAccount(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;

            const { name, automation } = req.body;
            const savingsAccount = new SavingsAccount({
                userId: userId,
                name,
                automation
            });
            await savingsAccount.save();
            res.status(201).json(savingsAccount);
        } catch (error) {
            res.status(400).json({ error: 'Failed to create savings account', details: error.message });
        }
    }

    static async transferToSavings(req, res) {
        try {
            const { amount, walletId } = req.body;
            const userId = req.user._id || req.query.userId || req.user.userId;

            const wallet = await Wallet.findOne({ _id: walletId, userId: userId});
            const savingsAccount = await SavingsAccount.findOne({ userId: userId });

            if (!wallet || wallet.balance < amount) {
                return res.status(400).json({ error: 'Insufficient funds in wallet' });
            }

            wallet.balance -= amount;
            savingsAccount.balance += amount;

            await wallet.save();
            await savingsAccount.save();

            res.json({ message: 'Transfer successful', savingsAccount });
        } catch (error) {
            res.status(500).json({ error: 'Transfer failed', details: error.message });
        }
    }

    static async getUserSavingsAccounts(req, res) {
        try {
            const userId = req.user._id || req.query.userId || req.user.userId;

            const accounts = await SavingsAccount.find({ userId: userId });
            res.json(accounts);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch savings accounts' });
        }
    }

    static async deleteSavingsAccount(req, res) {
        try {
            await SavingsAccount.findByIdAndDelete(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: 'Failed to delete savings account' });
        }
    }

    static async updateSavingsAccount(req, res) {
        try {
            const account = await SavingsAccount.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(account);
        } catch (error) {
            res.status(400).json({ error: 'Failed to update savings account' });
        }
    }

    static async updateTransaction(req, res) {
        try {
            const account = await SavingsAccount.findById(req.params.id);
            const transactionIndex = account.transactions.findIndex(t => t._id.toString() === req.body._id);
            if (transactionIndex > -1) {
                account.transactions[transactionIndex] = req.body;
                await account.save();
                res.json(account);
            } else {
                res.status(404).json({ error: 'Transaction not found' });
            }
        } catch (error) {
            res.status(400).json({ error: 'Failed to update transaction' });
        }
    }
}

module.exports = SavingsAccountController;