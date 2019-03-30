const xss = require('xss');

const { query, paged, conditionalUpdate } = require('../database/db');
const { getUserById } = require('./user');
const { validateOrder } = require('./validate');

/**
 * Sækir pantanir.
 *
 * @param {number} id Id á notanda
 * @param {number} offset Hvaða pöntun á að byrja á
 * @param {number} limit Hversu margar pantanir á að ná í
 * @returns {array} Fylki með pöntunum
 */
async function getOrders(id, { offset = 0, limit = 10 }) {
  const user = getUserById(id);
  const admin = { user };
  let result;
  if (admin) {
    result = await paged('SELECT * FROM ordercart WHERE isorder = true ORDER BY created', { offset, limit });
  } else {
    result = await paged(`SELECT * FROM ordercart WHERE isorder = true AND userId = ${id} ORDER BY created`, { offset, limit });
  }
  return result.rows;
}

/**
 * Sækir pöntun
 *
 * @param {number} id Id á pöntun
 * @param {number} userId Id á notanda
 * @param {number} offset Hvaða línu á að byrja á
 * @param {number} limit Hversu margar línur á að ná í
 * @returns {array} Fylki með pöntun með línum og fleira
 */
async function getOrder(id, userId, { offset = 0, limit = 10 }) {
  const user = getUserById(userId);
  const admin = { user };

  let orderSearch;
  if (admin) {
    orderSearch = await query(`SELECT * FROM ordercart WHERE id = ${id} AND isorder = true`);
  } else {
    orderSearch = await query(`SELECT * FROM ordercart WHERE id = ${id} AND userid = ${id} AND isorder = true`);
  }
  if (orderSearch.rowCount === 0) {
    return {
      success: false,
      notFound: true,
    };
  }

  const order = orderSearch.rows[0];

  const sumPrice = await query(
    `SELECT SUM(p.price*c.amount) FROM products p
    LEFT JOIN ordercartproducts c ON p.id = c.product
    WHERE c.ordercart = ${id}`,
  );
  const totalPrice = (sumPrice == null) ? 0 : sumPrice.rows[0].sum;

  const result = await paged(`SELECT * FROM ordercartproducts WHERE ordercart = ${id} ORDER BY id`, { offset, limit });
  return { order, lines: result.rows, totalPrice };
}

/**
 * Býr til nýja pöntun úr körfu.
 *
 * @param {number} id Id á notanda
 * @param {number} cartId Id á körfu
 * @param {string} name Nafn á notanda
 * @param {string} address Heimilisfang notanda
 * @returns {array} Fylki með pöntununni sem var búin til
 */
async function createOrder(id, cartId, name, address) {
  const user = getUserById(id);
  const admin = { user };

  const validation = validateOrder(cartId, name, address, admin);
  if (validation.length > 0) {
    return {
      success: false,
      validation,
    };
  }

  let cartSearch;
  if (admin) {
    cartSearch = await query(`SELECT * FROM ordercart WHERE id = ${cartId} AND isorder = false`);
  } else {
    cartSearch = await query(`SELECT * FROM ordercart WHERE userid = ${id} AND isorder = false`);
  }
  if (cartSearch.rowCount === 0) {
    return {
      success: false,
      notFound: true,
      validation: [],
    };
  }

  const cart = cartSearch.rows[0];
  const values = ['true', xss(name), xss(address)];
  const fields = ['isorder', 'name', 'address'];

  const result = await conditionalUpdate('ordercart', cart.id, fields, values);
  return {
    success: true,
    notFound: false,
    validation: [],
    item: result.rows[0],
  };
}

module.exports = {
  getOrders,
  getOrder,
  createOrder,
};
