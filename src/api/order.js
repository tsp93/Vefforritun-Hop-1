const {
  getOrders,
  getOrder,
  createOrder,
} = require('../functionality/order');

/**
 * Route handler til að ná í pantanir
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki með körfu
 */
async function getOrdersRoute(req, res) {
  const { id } = req.user;
  const result = await getOrders();

  if (!result) {
    return res.status(404).json({ error: 'No orders found' });
  }

  return res.status(200).json(result);
}

/**
 * Route handler til að ná í pöntun
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki með körfu
 */
async function getOrderRoute(req, res) {
  const { id } = req.user;
  const result = await getOrders();

  if (!result) {
    return res.status(404).json({ error: 'Order not found' });
  }

  return res.status(200).json(result);
}

/**
 * Route handler til að búa til pöntun
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki með körfu
 */
async function createOrderRoute(req, res) {
  const { id } = req.user;
  const result = await getOrders();

  if (!result) {
    return res.status(404).json({ error: 'No categories found' });
  }

  return res.status(200).json(result);
}

module.exports = {
  getOrdersRoute,
  getOrderRoute,
  createOrderRoute,
};
