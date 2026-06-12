const mongoose = require('mongoose');
const softDelete = require('../helpers/softDelete');
const dbFields = require('../helpers/dbFields');

const { Schema } = mongoose;

const schema = new Schema({
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    maxlength: 256,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});
schema.plugin(softDelete);
schema.plugin(dbFields, {
  fields: {
    public: ['_id', 'amount', 'description', 'date', 'type', 'user'],
    listing: ['_id', 'amount', 'description', 'date', 'type', 'user'],
    cp: ['_id', 'amount', 'description', 'date', 'type', 'user']
  }
});

schema.pre('save', function (next) {
  try {
    if (this.isModified('amount')) {
      // Determine type from amount sign
      this.type = this.amount >= 0 ? 'income' : 'expense';
    }
    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', schema);