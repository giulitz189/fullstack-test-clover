const supertest = require('supertest');
const app = require('../app');
const Transaction = require('../models/transaction');
const User = require('../models/user');
const { genereteAuthToken } = require('../helpers/auth');
const db = require('../db/connect-test');

const agent = supertest.agent(app);

beforeAll(async () => await db.connect());
beforeEach(async () => await db.clear());
afterAll(async () => await db.close());

describe('Transactions API', () => {
  let transactionId;
  let token;
  let userId;

  beforeEach(() => {
    const CreateUser = async () => {
      const testUser = await new User({
        name: 'Transaction',
        lastname: 'Admin',
        email: 'transactionuser@meblabs.com',
        password: 'testtest',
        roles: ['admin'],
        active: true
      }).save();

      token = genereteAuthToken(testUser).token;
      userId = testUser._id;
    };

    return CreateUser();
  });

  describe('POST /transactions', () => {
    it('should create a new transaction', async () => {
      const transactionData = {
        amount: 100,
        description: 'Test transaction',
        type: 'income',
        date: new Date(),
        user: userId
      };

      const response = await agent
        .post('/transactions')
        .set('Cookie', `accessToken=${token}`)
        .send(transactionData)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.amount).toBe(transactionData.amount);
      expect(response.body.description).toBe(transactionData.description);
      expect(response.body.type).toBe(transactionData.type);

      transactionId = response.body._id;
    });

    it('should fail with missing required fields', async () => {
      const response = await agent
        .post('/transactions')
        .set('Cookie', `accessToken=${token}`)
        .send({ description: 'Missing amount' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /transactions', () => {
    beforeEach(async () => {
      await Transaction.create([
        { amount: 100, description: 'Income', type: 'income', date: new Date(), user: userId },
        { amount: 50, description: 'Expense', type: 'expense', date: new Date(), user: userId }
      ]);
    });

    it('should retrieve all transactions', async () => {
      const response = await agent.get('/transactions').set('Cookie', `accessToken=${token}`).expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
    });

    it('should filter transactions by type', async () => {
      const response = await agent.get('/transactions?type=income').set('Cookie', `accessToken=${token}`).expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every(t => t.type === 'income')).toBe(true);
    });
  });

  describe('PATCH /transactions/:id', () => {
    beforeEach(async () => {
      const transaction = await Transaction.create({
        amount: 100,
        description: 'Original transaction',
        type: 'income',
        date: new Date(),
        user: userId
      });
      transactionId = transaction._id;
    });

    it('should update a transaction', async () => {
      const updateData = {
        amount: 150,
        description: 'Updated transaction'
      };

      const response = await agent
        .patch(`/transactions/${transactionId}`)
        .set('Cookie', `accessToken=${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body._id.toString()).toBe(transactionId.toString());
      expect(response.body.amount).toBe(150);
      expect(response.body.description).toBe('Updated transaction');
    });

    it('should return 404 when updating non-existent transaction', async () => {
      const fakeId = '000000000000000000000000';

      const response = await agent
        .patch(`/transactions/${fakeId}`)
        .set('Cookie', `accessToken=${token}`)
        .send({ amount: 200 })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /transactions/:id', () => {
    beforeEach(async () => {
      const transaction = await Transaction.create({
        amount: 100,
        description: 'Transaction to delete',
        type: 'income',
        date: new Date(),
        user: userId
      });
      transactionId = transaction._id;
    });

    it('should delete a transaction', async () => {
      const response = await agent
        .delete(`/transactions/${transactionId}`)
        .set('Cookie', `accessToken=${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('deleted');

      const deletedTransaction = await Transaction.findById(transactionId);
      expect(deletedTransaction).toBeNull();
    });

    it('should return 404 when deleting non-existent transaction', async () => {
      const fakeId = '000000000000000000000000';

      const response = await agent.delete(`/transactions/${fakeId}`).set('Cookie', `accessToken=${token}`).expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
