const express = require('express');

const { catchErrors } = require('../utils');
const {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
} = require('../actions/product');

const router = express.Router();
