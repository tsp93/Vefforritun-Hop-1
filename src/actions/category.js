const { query } = require('../database/db');

/**
 * TODO
 * getCategories
 * addCategory, only admin
 * updateCategory, only admin
 * deleteCategory, only admin
 */

// Nær í flokka
async function getCategories() {
  const result = await query('SELECT * FROM categories');
  return result.rows;
}

// Bætir við flokk
async function addCategory(category) {
  const result = await query(`SELECT * FROM products WHERE id = ${category}`);
  return result.rows;
}

// Uppfærir flokk
async function updateCategory(id) {
  const result = await query(`SELECT * FROM products WHERE id = ${id}`);
  return result.rows;
}

// Eyðir flokk
async function deleteCategory(id) {
  const result = await query(`SELECT * FROM products WHERE id = ${id}`);
  return result.rows;
}

module.exports = {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
};
