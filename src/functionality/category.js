const xss = require('xss');

const { query, paged, conditionalUpdate } = require('../database/db');
const { validateCategory } = require('./validate');

/**
 * Sækir flokka.
 *
 * @param {number} offset Hvaða flokk á að byrja á
 * @param {number} limit Hversu marga flokka á að ná í
 * @returns {array} Fylki af flokkum
 */
async function getCategories({ offset = 0, limit = 10 }) {
  const result = await paged('SELECT * FROM categories ORDER BY id', { offset, limit });
  return result.rows;
}

/**
 * Bætir við flokk
 *
 * @param {string} title Nafn á flokk
 * @returns {object} Hlutur með flokknum sem var búinn til
 */
async function createCategory(title) {
  const validation = validateCategory(title);
  if (validation.length > 0) {
    return {
      success: false,
      validation,
    };
  }

  const newTitle = xss(title);

  const q = `
  INSERT INTO categories (title)
  VALUES ($1)
  RETURNING *`;
  const values = [newTitle];
  let result;
  try {
    result = await query(q, values);
  } catch (error) {
    console.error(error);
  }

  if (!result || result.rowCount === 0) {
    return {
      success: false,
      alreadyExists: true,
      validation: [],
    };
  }

  return {
    success: true,
    alreadyExists: false,
    validation: [],
    item: result.rows[0],
  };
}

/**
 * Uppfærir flokk.
 *
 * @param {number} id Id á flokk
 * @param {string} title Nýtt nafn á flokk
 * @returns {object} Hlutur með uppfærðum flokk
 */
async function updateCategory(id, title) {
  const validation = validateCategory(title);

  if (validation.length > 0) {
    return {
      success: false,
      validation,
    };
  }

  const values = [xss(title)];
  const fields = ['title'];

  const result = await conditionalUpdate('categories', id, fields, values);

  if (result.rowCount === 0) {
    return {
      success: false,
      notFound: true,
      validation: [],
    };
  }

  return {
    success: true,
    notFound: false,
    validation: [],
    item: result.rows[0],
  };
}

/**
 * Eyðir flokk
 *
 * @param {number} id Id á flokk
 * @returns {object} Hlutur með eyddum flokk
 */
async function deleteCategory(id) {
  const result = await query(`DELETE FROM categories WHERE id = ${id} RETURNING *`);
  return result.rows[0];
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
