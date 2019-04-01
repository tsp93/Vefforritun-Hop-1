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
 * @returns {object} Hlutur með körfu
 */
async function getOrdersRoute(req, res) {
  const { id } = req.user;
  const { offset, limit } = req.query;
  const result = await getOrders(id, { offset, limit });

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
 * @returns {object} Hlutur með körfu
 */
async function getOrderRoute(req, res) {
  const { id } = req.params;
  const { offset, limit } = req.body;
  const userId = req.user.id;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const result = await getOrder(id, userId, { offset, limit });

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'Order not found' });
  }

  return res.status(200).json(result);
}

/**
 * Route handler til að búa til pöntun
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} Hlutur með pöntununni sem var búin til
 */
async function createOrderRoute(req, res) {
  const { id } = req.user;
  const { cartId, name, address } = req.body;
  const result = await createOrder(id, cartId, name, address);

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'Cart not found' });
  }

  return res.status(201).json(result.item);
}

module.exports = {
  getOrdersRoute,
  getOrderRoute,
  createOrderRoute,
};
