const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../functionality/product');

/**
 * Route handler til að ná í vörur
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki af vörum
 */
async function getProductsRoute(req, res) {
  const { offset = 0, limit = 10 } = req.query;
  const result = await getProducts({ offset, limit });

  if (!result) {
    return res.status(404).json({ error: 'No products found' });
  }

  return res.status(200).json(result);
}

/**
 * Route handler til að ná í vörur
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki af vörum
 */
async function getProductRoute(req, res) {
  const { id } = req.params;
  const result = await getProduct(id);

  if (!result) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.status(200).json(result);
}

/**
 * Route handler til að búa til vöru
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki með vörunni sem var búin til
 */
async function createProductRoute(req, res) {
  const {
    title, description, imagepath, category,
  } = req.body;

  if (!imagepath) {
    return res.status(400).json({ error: 'Unable to read image' });
  }

  const result = await createProduct(title, description, imagepath, category);

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  if (!result.success && result.notFound) {
    return res.status(409).json({ error: 'Product already exists' });
  }

  return res.status(201).json(result.item);
}

module.exports = {
  getProductsRoute,
  getProductRoute,
  createProductRoute,
};
