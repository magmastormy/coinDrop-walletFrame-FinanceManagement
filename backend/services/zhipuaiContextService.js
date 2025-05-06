const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');
const Wallet = require('../models/Wallet');
const SavingsAccount = require('../models/SavingsAccount');
const Category = require('../models/Category');

/**
 * Calculate user's net worth.
 */
async function calculateNetWorth(userId) {
  const wallets = await Wallet.find({ userId });
  const total = wallets.reduce((sum, w) => sum + w.balance, 0);
  const liquid = wallets
    .filter(w => ['checking', 'savings'].includes(w.type))
    .reduce((sum, w) => sum + w.balance, 0);
  return { total, liquid };
}

/**
 * Find recurring transactions within a date range.
 */
async function findRecurringTransactionsAndDueDates(userId, startDate, endDate) {
  // Placeholder: return empty list
  return [];
}

/**
 * Find upcoming bills within a date range.
 */
async function findUpcomingBills(userId, startDate, endDate) {
  // Placeholder: return empty list
  return [];
}

/**
 * Gather full user financial context.
 * @param {String} userId
 */
async function getContext(userId) {
  const now = new Date();
  const thirtyDaysLater = new Date(now);
  thirtyDaysLater.setDate(now.getDate() + 30);

  const [
    wallets,
    recentTransactions,
    budgets,
    savingsGoals,
    categories,
    netWorth,
    recurringTransactions,
    upcomingBills,
    savingsAccounts
  ] = await Promise.all([
    Wallet.find({ userId }),
    Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(10)
      .populate('category', 'name'),
    Budget.find({ userId }).populate('category', 'name'),
    SavingsGoal.find({ userId }),
    Category.find({ userId }),
    calculateNetWorth(userId),
    findRecurringTransactionsAndDueDates(userId, now, thirtyDaysLater),
    findUpcomingBills(userId, now, thirtyDaysLater),
    SavingsAccount.find({ userId }).lean()
  ]);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  // Monthly summary
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyTx = await Transaction.find({ userId, date: { $gte: firstOfMonth } });
  const monthlyExpenses = monthlyTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const monthlyIncome = monthlyTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const savingsRate = monthlyIncome > 0
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
    : 0;

  return {
    wallets,
    totalBalance,
    recentTransactions,
    budgets,
    savingsGoals,
    categories,
    netWorth,
    recurringTransactions,
    upcomingBills,
    savingsAccounts,
    financialSummary: { monthlyExpenses, monthlyIncome, savingsRate, netWorth }
  };
}

/**
 * Formats context into a text prompt for the AI.
 * @param {Object} ctx
 * @param {String} type - 'balance'|'budget'|'savings'|'bills'|'full'
 */
function formatContext(ctx, type = 'full') {
  switch (type) {
    case 'balance':
      return [
        `Total Balance: $${ctx.totalBalance}`,
        ...ctx.wallets.map(w => `- ${w.name}: $${w.balance} (${w.type})`)
      ].join('\n');
    case 'budget':
      return [
        'Budget Overview:',
        ...ctx.budgets.map(b => `- ${b.name} (${b.category.name}): $${b.amount}`)
      ].join('\n');
    case 'savings':
      return [
        'Savings Goals:',
        ...ctx.savingsGoals.map(g => `- ${g.name}: $${g.current}/${g.target} (${g.progress}% complete)`)
      ].join('\n');
    case 'bills':
      return [
        'Upcoming Bills:',
        ...ctx.upcomingBills.map(b => `- ${b.description || b.category}: $${b.amount} due in ${b.daysUntilDue} days`)
      ].join('\n');
    default:
      return JSON.stringify(ctx, null, 2);
  }
}

/**
 * Generate context-based suggestions.
 * @param {Object} ctx
 */
async function generateContextSuggestions(ctx) {
  // Placeholder suggestions
  return {
    generalAdvice: [
      "Consider reviewing your monthly subscriptions to cut down on recurring costs.",
      `Your savings rate is ${ctx.financialSummary.savingsRate.toFixed(1)}%. Aim for 20% for better financial health.`
    ]
  };
}

module.exports = { getContext, formatContext, generateContextSuggestions };
