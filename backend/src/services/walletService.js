const mongoose = require('mongoose');
const User = require('../models/User');
const { WalletTransaction } = require('../models/platform');

class WalletError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Runs fn inside a MongoDB transaction when the deployment supports it (replica
// set / Atlas). On a standalone dev server it runs without one; each balance
// change is still a single atomic, guarded $inc.
async function withTransaction(fn) {
  const topology = mongoose.connection.client?.topology?.description?.type || '';
  const supportsTx = /ReplicaSet|Sharded|LoadBalanced/i.test(topology);
  if (!supportsTx) return fn(null);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

const round = (n) => Math.round(Number(n) * 100) / 100;

async function credit(userId, amount, reason, { reference = '', note = '' } = {}, session = null) {
  const amt = round(amount);
  if (!(amt > 0)) throw new WalletError('Amount must be positive');
  const user = await User.findByIdAndUpdate(userId, { $inc: { walletBalance: amt } }, { new: true, session });
  if (!user) throw new WalletError('User not found', 404);
  const [txn] = await WalletTransaction.create(
    [{ user: userId, type: 'credit', amount: amt, balanceAfter: user.walletBalance, reason, reference, note }],
    { session }
  );
  return txn;
}

async function debit(userId, amount, reason, { reference = '', note = '' } = {}, session = null) {
  const amt = round(amount);
  if (!(amt > 0)) throw new WalletError('Amount must be positive');
  // Guarded update: only succeeds when the balance covers the debit.
  const user = await User.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: amt } },
    { $inc: { walletBalance: -amt } },
    { new: true, session }
  );
  if (!user) throw new WalletError('Insufficient wallet balance');
  const [txn] = await WalletTransaction.create(
    [{ user: userId, type: 'debit', amount: amt, balanceAfter: user.walletBalance, reason, reference, note }],
    { session }
  );
  return txn;
}

module.exports = { credit, debit, withTransaction, WalletError };
