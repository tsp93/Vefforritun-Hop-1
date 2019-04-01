const {
  getCart,
  addToCart,
  getCartLine,
  updateCartLine,
  deleteCartLine,
} = require('../functionality/cart');

/**
 * Route handler til að ná í körfu
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} Hlutur með körfu
 */
async function getCartRoute(req, res) {
  const { id } = req.user;
  const { offset, limit } = req.query;
  const result = await getCart(id, { offset, limit });

  return res.status(200).json(result);
}

/**
 * Route handler til að bæta í körfu
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} Hlutur með körfu
 */
async function addToCartRoute(req, res) {
  const { id } = req.user;
  const { productId, amount } = req.body;

  const result = await addToCart(id, productId, amount);

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'Product does not exist' });
  }

  if (!result.success && result.alreadyInCart) {
    return res.status(409).json({ error: 'Product already in cart' });
  }

  return res.status(201).json(result.item);
}

/**
 * Route handler til að ná í línu úr körfu
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} Hlutur með línu úr körfu
 */
async function getCartLineRoute(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Line not found' });
  }

  const result = await getCartLine(userId, id);

  if (!result) {
    return res.status(404).json({ error: 'Line not found' });
  }

  return res.status(200).json(result);
}

/**
 * Route handler til að uppfæra línu í körfu
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} Hlutur með uppfærðri línu úr körfu
 */
async function updateCartLineRoute(req, res) {
  const { id } = req.params;
  const { amount } = req.body;
  const userId = req.user.id;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Line not found' });
  }

  const result = await updateCartLine(userId, id, amount);

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  if (!result.success && !result.alreadyExists) {
    return res.status(404).json({ error: 'Line not found' });
  }

  if (!result.success && !result.allowed) {
    return res.status(403).json({ error: 'Not allowed to change line that is not in cart' });
  }

  return res.status(200).json(result.item);
}

/**
 * Route handler til að eyða línu úr körfu
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} Hlutur með eyddri línu úr körfu
 */
async function deleteCartLineRoute(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Line not found' });
  }

  const result = await deleteCartLine(userId, id);

  if (!result.success && !result.alreadyExists) {
    return res.status(404).json({ error: 'Line not found' });
  }

  if (!result.success && !result.allowed) {
    return res.status(403).json({ error: 'Not allowed to delete line that is not in cart' });
  }

  return res.status(200).json(result.item);
}

module.exports = {
  getCartRoute,
  addToCartRoute,
  getCartLineRoute,
  updateCartLineRoute,
  deleteCartLineRoute,
};
