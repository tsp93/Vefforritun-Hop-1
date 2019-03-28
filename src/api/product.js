const { query } = require('../database/db');

/**
 * TODO
 * getProducts(category=null, query=null), newest first
 * getProduct(id)
 * updateProduct(id), only admin
 * deleteProduct(id), only admin
 * addProduct(product), if valid only for admin
 */

// Sækir vörur
async function getProducts(category = null, text = null) {
  let q = 'SELECT * FROM products';

  if (category != null || text != null) {
    q = `${q} WHERE`;
    if (category != null) {
      q = `${q} categoryid = ${category}`;
    }
    if (text != null) {
      q = `${q} title LIKE '%${text}%' OR description LIKE '%${text}%'`;
    }
  }
  q = `${q} ORDER BY created`;

  const result = await query(q);
  return result.rows;
}

// Sækir vöru
async function getProduct(id) {
  const result = await query(`SELECT * FROM products WHERE id = ${id}`);
  return result.rows;
}

// Bætir við vöru
async function addProduct(product) {
  const result = await query(`SELECT * FROM products WHERE id = ${product}`);
  return result.rows;
}

// Uppfærir vöru
async function updateProduct(id) {
  const result = await query(`SELECT * FROM products WHERE id = ${id}`);
  return result.rows;
}

// Eyðir vöru
async function deleteProduct(id) {
  const result = await query(`DELETE FROM products WHERE id = ${id}`);
  return result.rows;
}

module.exports = {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
};
