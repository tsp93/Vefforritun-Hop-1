const { query, paged, conditionalUpdate } = require('../database/db');
const { getProductById } = require('./product');
const { validateLine } = require('./validate');

/**
 * Sækir körfu eftir notenda. Ef karfa er ekki til þá er ein búin til.
 *
 * @param {number} id Id á notanda
 * @returns {object} Hlutur með körfu
 */
async function getCartInfo(id) {
  let cartSearch = await query(`SELECT * FROM ordercart WHERE userid = ${id} AND isorder = false`);
  if (cartSearch.rowCount === 0) {
    cartSearch = await query('INSERT INTO ordercart (userid, isorder) VALUES ($1, $2) RETURNING *', [id, false]);
  }
  return cartSearch.rows[0];
}

/**
 * Sækir körfu með línum.
 *
 * @param {number} id Id á notanda
 * @param {number} offset Hvaða línu á að byrja á
 * @param {number} limit Hversu margar línur á að ná í
 * @returns {object} Hlutur með körfu og línum
 */
async function getCart(id, { offset = 0, limit = 10 }) {
  const cart = await getCartInfo(id);

  const sumPrice = await query(
    `SELECT SUM(p.price*c.amount) FROM products p
    LEFT JOIN ordercartproducts c ON p.id = c.product
    WHERE c.ordercart = ${cart.id}`,
  );
  const totalPrice = (sumPrice == null) ? 0 : sumPrice.rows[0].sum;

  const result = await paged(`SELECT * FROM ordercartproducts WHERE ordercart = ${cart.id} ORDER BY id`, { offset, limit });
  return { cart, lines: result.rows, totalPrice };
}

/**
 * Bætir línu við körfu.
 *
 * @param {number} id Id á notanda
 * @param {number} productId Id á vöru
 * @param {number} amount Fjöldi af vöru
 * @returns {object} Hlutur með línunni sem bætta var við
 */
async function addToCart(id, productId, amount) {
  const validation = validateLine(productId, amount, false);
  if (validation.length > 0) {
    return {
      success: false,
      validation,
    };
  }

  const product = await getProductById(productId);
  if (!product) {
    return {
      success: false,
      notFound: true,
      validation: [],
    };
  }

  const cart = await getCartInfo(id);
  const values = [cart.id, Number(productId), Number(amount)];

  const exists = await query(
    `SELECT * FROM ordercartproducts 
    WHERE ordercart = ${cart.id} AND product = ${productId} ORDER BY id`,
  );
  if (exists.rowCount !== 0) {
    return {
      success: false,
      notFound: false,
      alreadyInCart: true,
      validation: [],
    };
  }

  const result = await query(
    `INSERT INTO ordercartproducts (ordercart, product, amount) 
    VALUES ($1, $2, $3)
    RETURNING *`,
    values,
  );
  return {
    success: true,
    notFound: false,
    alreadyInCart: false,
    validation: [],
    item: result.rows[0],
  };
}

/**
 * Nær í línu í körfu.
 *
 * @param {number} userId Id á notanda
 * @param {number} id Id á línu í körfu
 * @returns {object} Hlutur með línu úr körfu
 */
async function getCartLine(userId, id) {
  const cart = await getCartInfo(userId);

  const result = await query(
    `SELECT * FROM ordercartproducts 
    WHERE ordercart = ${cart.id} AND id = ${id}`,
  );
  return result.rows[0];
}

/**
 * Uppfærir línu í körfu.
 *
 * @param {number} userId Id á notanda
 * @param {number} Id Id á línu í körfu
 * @param {number} amount Fjöldi af vöru
 * @returns {object} Hlutur með uppfærðri línu úr körfu
 */
async function updateCartLine(userId, id, amount) {
  const validation = validateLine(null, amount, true);
  if (validation.length > 0) {
    return {
      success: false,
      validation,
    };
  }

  const checkExists = await query(`SELECT * FROM ordercartproducts WHERE id = ${id}`);
  if (checkExists.rowCount === 0) {
    return {
      success: false,
      alreadyExists: false,
      validation: [],
    };
  }

  const cart = await getCartInfo(userId);
  const checkInCart = await query(
    `SELECT * FROM ordercartproducts 
    WHERE id = ${id} AND ordercart = ${cart.id}`,
  );
  if (checkInCart.rowCount === 0) {
    return {
      success: false,
      alreadyExists: true,
      allowed: false,
      validation: [],
    };
  }

  const values = [id, Number(amount)];
  const fields = ['id', 'amount'];

  const result = await conditionalUpdate('ordercartproducts', id, fields, values);
  return {
    success: true,
    alreadyExists: true,
    allowed: true,
    validation: [],
    item: result.rows[0],
  };
}

/**
 * Eyðir línu úr körfu.
 *
 * @param {number} userId Id á notanda
 * @param {number} Id Id á línu í körfu
 * @returns {object} Hlutur með eyddri línu úr körfu
 */
async function deleteCartLine(userId, id) {
  const checkExists = await query(`SELECT * FROM ordercartproducts WHERE id = ${id}`);
  if (checkExists.rowCount === 0) {
    return {
      success: false,
      alreadyExists: false,
    };
  }

  const cart = await getCartInfo(userId);
  const checkInCart = await query(
    `SELECT * FROM ordercartproducts 
    WHERE id = ${id} AND ordercart = ${cart.id}`,
  );
  if (checkInCart.rowCount === 0) {
    return {
      success: false,
      alreadyExists: true,
      allowed: false,
    };
  }

  const result = await query(`DELETE FROM ordercartproducts WHERE id=${id} RETURNING *`);
  return {
    success: true,
    alreadyExists: true,
    allowed: true,
    item: result.rows[0],
  };
}

module.exports = {
  getCart,
  addToCart,
  getCartLine,
  updateCartLine,
  deleteCartLine,
};
