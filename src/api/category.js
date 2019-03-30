const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../functionality/category');

/**
 * Route handler til að ná í flokka
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki af flokkum
 */
async function getCategoriesRoute(req, res) {
  const { offset = 0, limit = 10 } = req.query;
  const result = await getCategories({ offset, limit });

  if (!result) {
    return res.status(404).json({ error: 'No categories found' });
  }

  return res.status(200).json(result);
}

/**
 * Route handler til að búa til flokk
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki með flokknum sem var búinn til
 */
async function createCategoryRoute(req, res) {
  const { title } = req.body;
  const result = await createCategory(title);

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  if (!result.success && result.alreadyExists) {
    return res.status(409).json({ error: 'Category already exists' });
  }

  return res.status(201).json(result.item);
}

/**
 * Route handler til að uppfæra
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki með uppfærðum flokk
 */
async function updateCategoryRoute(req, res) {
  const { title } = req.body;
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const result = await updateCategory(id, title);

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'Category not found' });
  }

  return res.status(200).json(result.item);
}

/**
 * Route handler til að eyða flokk
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki með eyddum flokk
 */
async function deleteCategoryRoute(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'Category not found' });
  }

  const result = await deleteCategory(id);

  if (!result) {
    return res.status(404).json({ error: 'Category not found' });
  }

  return res.status(200).json(result);
}

module.exports = {
  getCategoriesRoute,
  createCategoryRoute,
  updateCategoryRoute,
  deleteCategoryRoute,
};
