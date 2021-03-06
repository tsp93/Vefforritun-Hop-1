const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../functionality/product');

/**
 * Route handler til að ná í vörur
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} Hlutur með vörum
 */
async function getProductsRoute(req, res) {
  const {
    offset = 0, limit = 10, category = null, search = null,
  } = req.query;
  const result = await getProducts({
    offset, limit, category, search,
  });

  if (!result) {
    return res.status(404).json({ error: 'No products found' });
  }

  return res.status(200).json(result);
}

/**
 * Route handler til að ná í vöru
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} Hlutur með vöru
 */
async function getProductRoute(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const result = await getProductById(id);

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
 * @returns {object} Hlutur með vörunni sem var búin til
 */
async function createProductRoute(req, res) {
  const {
    title, description, price, imagepath, categoryId,
  } = req.body;

  const result = await createProduct(title, description, price, imagepath, categoryId);

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  if (!result.success && result.alreadyExists) {
    return res.status(409).json({ error: 'Product already exists' });
  }

  return res.status(201).json(result.item);
}

/**
 * Route handler til að breyta vöru
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} Hlutur með breyttri vöru
 */
async function updateProductRoute(req, res) {
  const {
    title, description, price, imagepath, categoryId,
  } = req.body;
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const result = await updateProduct(id, title, description, price, imagepath, categoryId);

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.status(200).json(result.item);
}

/**
 * Route handler til að eyða vöru
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} Hlutur af eyddri vöru
 */
async function deleteProductRoute(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const result = await deleteProduct(id);

  if (!result) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.status(200).json(result);
}

module.exports = {
  getProductsRoute,
  getProductRoute,
  createProductRoute,
  updateProductRoute,
  deleteProductRoute,
};
