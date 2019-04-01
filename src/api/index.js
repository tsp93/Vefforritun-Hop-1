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
const {
  getOrdersRoute,
  getOrderRoute,
  createOrderRoute,
} = require('./order');

const router = express.Router();

/**
 * Route handler fyrir index
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} Hlutur öllum mögulegum leiðum
 */
function indexRoute(req, res) {
  return res.json({
    users: {
      users: '/users/',
      user: '/users/{id}',
      me: '/users/me',
      register: '/users/register',
      login: '/users/login',
    },
    categories: {
      categories: '/categories/',
      category: '/categories/{id}',
    },
    products: {
      products: '/products/',
      product: '/products/{id}',
    },
    cart: {
      cart: '/cart/',
      line: '/cart/line/{id}',
    },
    orders: {
      orders: '/orders/',
      order: '/orders/{id}',
    },
  });
}

router.get('/', indexRoute);

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

router.get('/orders/', requireAuth, catchErrors(getOrdersRoute));
router.post('/orders/', requireAuth, catchErrors(createOrderRoute));
router.get('/orders/:id', requireAuth, catchErrors(getOrderRoute));

module.exports = router;
