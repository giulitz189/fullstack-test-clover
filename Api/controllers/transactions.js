const { SendData, ServerError, NotFound, Unauthorized, AlreadyExists } = require('../helpers/response');
const getter = require('../helpers/getter');
const Transaction = require('../models/transaction');
const { canUpdateTransaction, canDeleteTransaction } = require('../rbac/transactions');

exports.get = async (req, res, next) => {
  try {
    const { filter } = req.query;
    const query = {};

    if (filter) {
      query.description = new RegExp(filter, 'i');
    }

    const data = await getter(Transaction, query, req, res);

    return next(SendData(data));
  } catch (err) {
    return next(ServerError(err));
  }
};

exports.create = async (req, { locals: { user } }, next) => {
  try {
    const data = new Transaction({ ...req.body, user: user.id });

    data.__history = {
      user: user.id,
      transaction: data._id,
      event: 'create',
      method: 'create'
    };

    await data.save();

    return next(SendData(data.response('cp')));
  } catch (err) {
    return next(ServerError(err));
  }
};

exports.update = async ({ params: { id }, body }, { locals: { user } }, next) => {
  try {
    const targetTransaction = await canUpdateTransaction(user, id);
    if (targetTransaction === null) return next(NotFound());
    if (!targetTransaction) return next(Unauthorized());

    const data = Object.assign(targetTransaction, body);

    data.__history = {
      event: 'update',
      method: 'update',
      user: user.id,
      transaction: targetTransaction._id
    };

    await data.save();

    return next(SendData(targetTransaction.response('cp')));
  } catch (err) {
    if (err.code === 11000) return next(AlreadyExists());
    return next(ServerError(err));
  }
};

exports.delete = async ({ params: { id } }, { locals: { user } }, next) => {
  try {
    const targetTransaction = await canDeleteTransaction(user, id);
    if (targetTransaction === null) return next(NotFound());
    if (!targetTransaction) return next(Unauthorized());

    await targetTransaction.softDelete();

    return next(SendData({ message: 'Transaction deleted successfully' }));
  } catch (err) {
    return next(ServerError(err));
  }
};