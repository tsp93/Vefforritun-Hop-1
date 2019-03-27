const express = require('express');

const { catchErrors } = require('../utils');
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = require('../actions/category');

const router = express.Router();
