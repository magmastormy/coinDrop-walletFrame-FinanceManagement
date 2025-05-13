const Wallet = require('../models/Wallet');
const mongoose = require('mongoose');

/**
 * Creates a system wallet for a user when there's no other wallet to transfer money to.
 * This wallet is protected from deletion and clearly labeled as a system wallet.
 * 
 * @param {string} userId - The ID of the user who owns the wallet
 * @param {number} initialBalance - Initial balance to set for the wallet
 * @param {mongoose.ClientSession} session - Mongoose session for transaction support
 * @returns {Promise<Object>} The created system wallet
 */
async function createSystemWallet(userId, initialBalance = 0, session = null) {
    console.log(`[SystemWalletUtil] Creating system wallet for user ${userId} with initial balance ${initialBalance}`);
    
    const walletData = {
        userId,
        name: "System Wallet (Protected)",
        balance: initialBalance,
        currency: "USD", // Default currency
        isSystemWallet: true,
        metadata: {
            icon: 'account_balance_wallet',
            color: '#4caf50' // Green color to distinguish it
        },
        description: "This is a system-generated wallet to store your money when other accounts are deleted. This wallet cannot be deleted while it contains funds."
    };

    const saveOptions = session ? { session } : {};
    const systemWallet = new Wallet(walletData);
    await systemWallet.save(saveOptions);
    
    console.log(`[SystemWalletUtil] System wallet created successfully with ID: ${systemWallet._id}`);
    return systemWallet;
}

/**
 * Finds an available wallet for a user to transfer money to.
 * If no wallet exists, creates a system wallet.
 * 
 * @param {string} userId - The ID of the user
 * @param {string} excludeWalletId - Optional wallet ID to exclude from the search
 * @param {number} amountToTransfer - Amount of money to transfer
 * @param {mongoose.ClientSession} session - Mongoose session for transaction support
 * @returns {Promise<Object>} The target wallet
 */
async function findOrCreateTargetWallet(userId, excludeWalletId = null, amountToTransfer = 0, session = null) {
    console.log(`[SystemWalletUtil] Finding target wallet for user ${userId}, excluding wallet ${excludeWalletId}`);
    
    const query = { 
        userId, 
        isActive: true 
    };
    
    if (excludeWalletId) {
        query._id = { $ne: excludeWalletId };
    }
    
    const findOptions = session ? { session } : {};
    let targetWallet = await Wallet.findOne(query).sort({ balance: -1 }).session(session);
    
    if (!targetWallet) {
        console.log(`[SystemWalletUtil] No existing wallet found, creating system wallet`);
        targetWallet = await createSystemWallet(userId, amountToTransfer, session);
    } else {
        console.log(`[SystemWalletUtil] Found existing wallet: ${targetWallet._id}`);
        if (amountToTransfer > 0) {
            targetWallet.balance += amountToTransfer;
            await targetWallet.save(findOptions);
            console.log(`[SystemWalletUtil] Updated wallet balance to: ${targetWallet.balance}`);
        }
    }
    
    return targetWallet;
}

module.exports = {
    createSystemWallet,
    findOrCreateTargetWallet
};
