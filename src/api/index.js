const express = require('express');

const { catchErrors } = require('../utils');
const { requireAuth, isAdmin } = require('../auth');
const {
  getUsersRoute,
  getUserRoute,
  changeAdminRoute,
  createUserRoute,
  getMeRoute,
  changeMeRoute,
} = require('./user');
const {
  getProductsRoute,
  getProductRoute,
  createProductRoute,
} = require('./product');

const router = express.Router();


router.get('/users/me', requireAuth, catchErrors(getMeRoute));
router.patch('/users/me', requireAuth, catchErrors(changeMeRoute));
router.post('/users/register', catchErrors(createUserRoute));
router.get('/users/', requireAuth, isAdmin, catchErrors(getUsersRoute));
router.get('/users/:id', requireAuth, isAdmin, catchErrors(getUserRoute));
router.patch('/users/:id', requireAuth, isAdmin, catchErrors(changeAdminRoute));

router.get('/products/', catchErrors(getProductsRoute));
router.post('/products/', catchErrors(createProductRoute));
router.get('/products/:id', catchErrors(getProductRoute));

module.exports = router;