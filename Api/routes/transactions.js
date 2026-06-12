const express = require('express');
const { isAuth } = require('../middlewares/isAuth');
const rbac = require('../middlewares/rbac');
const controller = require('../controllers/transactions');
const { validator } = require('../middlewares/validator');

const router = express.Router();

router
  .route('/')
  .get(isAuth, rbac('transactions', 'read'), controller.get)
  .post(validator({ body: 'createTransaction' }), isAuth, rbac('transactions', 'create'), controller.create);

router
  .route('/:id')
  .patch(
    validator({ body: 'updateTransaction', params: 'id' }),
    isAuth,
    rbac('transactions', 'update'),
    controller.update
  )
  .delete(validator({ params: 'id' }), isAuth, rbac('transactions', 'delete'), controller.delete);

module.exports = router;