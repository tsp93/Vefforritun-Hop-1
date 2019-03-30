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
  updateProductRoute,
  deleteProductRoute,
} = require('./product');
const {
  getCategoriesRoute,
  createCategoryRoute,
  updateCategoryRoute,
  deleteCategoryRoute,
} = require('./category');
const {
  getCartRoute,
  addToCartRoute,
  getCartLineRoute,
  updateCartLineRoute,
  deleteCartLineRoute,
} = require('./cart');

const router = express.Router();


router.get('/users/me', requireAuth, catchErrors(getMeRoute));
router.patch('/users/me', requireAuth, catchErrors(changeMeRoute));
router.post('/users/register', catchErrors(createUserRoute));
router.get('/users/', requireAuth, isAdmin, catchErrors(getUsersRoute));
router.get('/users/:id', requireAuth, isAdmin, catchErrors(getUserRoute));
router.patch('/users/:id', requireAuth, isAdmin, catchErrors(changeAdminRoute));

router.get('/categories/', catchErrors(getCategoriesRoute));
router.post('/categories/', requireAuth, isAdmin, catchErrors(createCategoryRoute));
router.patch('/categories/:id', requireAuth, isAdmin, catchErrors(updateCategoryRoute));
router.delete('/categories/:id', requireAuth, isAdmin, catchErrors(deleteCategoryRoute));

router.get('/products/', catchErrors(getProductsRoute));
router.post('/products/', requireAuth, isAdmin, catchErrors(createProductRoute));
router.get('/products/:id', catchErrors(getProductRoute));
router.patch('/products/:id', requireAuth, isAdmin, catchErrors(updateProductRoute));
router.delete('/products/:id', requireAuth, isAdmin, catchErrors(deleteProductRoute));

router.get('/cart/', requireAuth, catchErrors(getCartRoute));
router.post('/cart/', requireAuth, catchErrors(addToCartRoute));
router.get('/cart/line/:id', requireAuth, catchErrors(getCartLineRoute));
router.patch('/cart/line/:id', requireAuth, catchErrors(updateCartLineRoute));
router.delete('/cart/line/:id', requireAuth, catchErrors(deleteCartLineRoute));

module.exports = router;
