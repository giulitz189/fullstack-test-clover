module.exports = {
  createTransaction: {
    $id: 'transaction',
    type: 'object',
    properties: {
      amount: { type: 'number' },
      description: { type: 'string', maxLength: 256 },
      date: { type: 'string', format: 'date-time' },
      type: { type: 'string', enum: ['income', 'expense'] },
      user: { type: 'string' }
    },
    required: ['amount', 'type']
  },
  updateTransaction: {
    $id: 'updateTransaction',
    type: 'object',
    properties: {
      amount: { type: 'number' },
      description: { type: 'string', maxLength: 256 },
      date: { type: 'string', format: 'date-time' },
      type: { type: 'string', enum: ['income', 'expense'] },
      user: { type: 'string' }
    }
  }
};