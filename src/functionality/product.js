const cloudinary = require('cloudinary').v2;
const xss = require('xss');

const { query, paged, conditionalUpdate } = require('../database/db');
const { validateProduct } = require('./validate');

const {
  CLOUDINARY_CLOUD,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!CLOUDINARY_CLOUD || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn('Missing cloudinary config, uploading images will not work');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

/**
 * TODO
 * getProducts(category=null, query=null), newest first
 * getProduct(id)
 * updateProduct(id), only admin
 * deleteProduct(id), only admin
 * createProduct(product), if valid only for admin
 */

/**
 * Sækir vörur.
 *
 * @param {number} offset Hvaða vöru á að byrja á
 * @param {number} limit Hversu margar vörur á að ná í
 * @returns {array} Fylki af vörum
 */
async function getProducts({
  category = null, text = null, offset = 0, limit = 10,
}) {
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

  const result = await paged(q, { offset, limit });
  return result.rows;
}

/**
 * Sækir vöru eftir id.
 *
 * @param {number} id
 * @returns {array} Fylki með vöru
 */
async function getProduct(id) {
  const result = await query(`SELECT * FROM products WHERE id = ${id}`);
  return result.rows;
}

/**
 * Býr til nýja vöru.
 *
 * @param {string} title Titill á vöru
 * @param {string} description Lýsing á vöru
 * @param {string} image Nafn á mynd með endingu: jpg, png eða gif
 * @returns {array} Fylki með vöru
 */
async function createProduct(title, description, imagepath, category) {
  const catQ = `SELECT id FROM categories WHERE title = '${category}'`;
  let categoryId = null;
  try {
    const res = await query(catQ);
    categoryId = res.rows[0].id;
  } catch (error) {
    console.error(error);
  }

  const validation = validateProduct({
    title, description, imagepath, categoryId,
  }, false);
  if (validation.length > 0) {
    return {
      success: false,
      notFound: false,
      validation,
      item: null,
    };
  }

  let upload = null;
  try {
    upload = await cloudinary.uploader.upload(imagepath, { folder: 'Vef2-Hop1', use_filename: true });
  } catch (error) {
    if (error.http_code && error.http_code === 400) {
      return {
        success: false,
        notFound: false,
        validation: [{ error: error.message }],
        item: null,
      };
    }

    return {
      success: false,
      notFound: false,
      validation: [{ error: `Unable to upload file to cloudinary: ${imagepath}` }],
      item: null,
    };
  }

  const product = {
    title: xss(title),
    description: xss(description),
    image: upload.secure_url,
    categoryid: categoryId,
  };

  const q = `
  INSERT INTO products (title, description, image, categoryid)
  VALUES ($1, $2, $3, $4)
  RETURNING *`;
  const values = [product.title, product.description, product.image, product.categoryid];
  let result = null;
  try {
    result = await query(q, values);
  } catch (error) {
    console.error(error);
  }

  if (!result || result.rowCount === 0) {
    return {
      success: false,
      notFound: true,
      validation: [],
      item: null,
    };
  }

  return {
    success: true,
    notFound: false,
    validation: [],
    item: result.rows[0],
  };
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
  createProduct,
  updateProduct,
  deleteProduct,
};
