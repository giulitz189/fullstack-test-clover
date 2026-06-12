const Transaction = require('../models/transaction');

const transactionRbac = async (caller, resourceId) => {
  const transaction = await Transaction.findById(resourceId);
  if (!transaction) return null;

  // Users can only manage their own transactions
  if (transaction.user.toString() === caller.id) return transaction;

  return false;
};

module.exports.canUpdateTransaction = (caller, resourceId) => transactionRbac(caller, resourceId);

module.exports.canDeleteTransaction = (caller, resourceId) => transactionRbac(caller, resourceId);