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
 * Sækir vörur.
 *
 * @param {number} offset Hvaða vöru á að byrja á
 * @param {number} limit Hversu margar vörur á að ná í
 * @returns {array} Fylki af vörum
 */
async function getProducts({
  category = null, search = null, offset = 0, limit = 10,
}) {
  let q = 'SELECT * FROM products';

  if (category != null || search != null) {
    q = `${q} WHERE`;
    if (category != null) {
      q = `${q} categoryid = ${category}`;
    }
    if (category != null && search != null) {
      q = `${q} AND`;
    }
    if (search != null) {
      q = `${q} title LIKE '%${search}%' OR description LIKE '%${search}%'`;
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
async function getProductById(id) {
  const result = await query(`SELECT * FROM products WHERE id = ${id}`);
  return result.rows[0];
}

/**
 * Sækir vöru eftir nafni.
 *
 * @param {string} title Nafn á vöru
 * @returns {array} Fylki með vöru
 */
async function getProductByTitle(title) {
  const result = await query(`SELECT * FROM products WHERE title = '${title}'`);
  return result.rows[0];
}

/**
 * Uploadar mynd á Cloudinary
 *
 * @param {string} imagepath Path á mynd sem er verið að uploada
 * @returns {object} Gögn um myndina sem var uploadað á Cloudinary
 */
async function uploadToCloudinary(imagepath) {
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
  return { item: upload };
}

/**
 * Býr til nýja vöru.
 *
 * @param {string} title Titill á vöru
 * @param {string} description Lýsing á vöru
 * @param {string} image Path á mynd með endingu: jpg, png eða gif
 * @param {string} categoryID Id á flokk
 * @returns {array} Fylki með vöru
 */
async function createProduct(title, description, imagepath, categoryID) {
  const validation = validateProduct({
    title, description, imagepath, categoryID,
  }, false);
  if (validation.length > 0) {
    return {
      success: false,
      validation,
    };
  }

  const categoryId = Number(categoryID);

  const prod = await getProductByTitle(title);
  if (prod != null) {
    return {
      success: false,
      alreadyExists: true,
      validation: [],
    };
  }

  const cloudResult = await uploadToCloudinary(imagepath);
  const { item } = cloudResult;
  if (item == null) {
    return cloudResult;
  }

  const product = {
    title: xss(title),
    description: xss(description),
    image: item.secure_url,
    categoryId,
  };

  const q = `
  INSERT INTO products (title, description, image, categoryid)
  VALUES ($1, $2, $3, $4)
  RETURNING *`;
  const values = [product.title, product.description, product.image, product.categoryId];
  let result = null;
  try {
    result = await query(q, values);
  } catch (error) {
    console.error(error);
  }

  if (!result || result.rowCount === 0) {
    return {
      success: false,
      alreadyExists: false,
      validation: [{ error: 'Invalid category' }],
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
 * Uppfærir vöru
 *
 * @param {number} id Id á vöru sem á að breyta
 * @param {string} title Titill á vöru
 * @param {string} description Lýsing á vöru
 * @param {string} image Path á mynd með endingu: jpg, png eða gif
 * @param {string} categoryID Id á flokk
 *
 * @returns {array} Varan sem var breytt
 */
async function updateProduct(id, title, description, imagepath, categoryID) {
  const validation = validateProduct({
    title, description, imagepath, categoryID,
  }, true);

  if (validation.length > 0) {
    return {
      success: false,
      validation,
    };
  }

  let upload = null;
  if (imagepath != null) {
    const cloudResult = await uploadToCloudinary(imagepath);
    const { item } = cloudResult;
    if (item == null) {
      return cloudResult;
    }
    upload = item;
  }

  const values = [
    title ? xss(title) : null,
    description ? xss(description) : null,
    upload.secure_url,
    categoryID ? Number(categoryID) : null,
  ]
    .filter(Boolean);

  const fields = [
    title ? 'title' : null,
    description ? 'description' : null,
    imagepath ? 'image' : null,
    categoryID ? 'categoryid' : null,
  ]
    .filter(Boolean);

  const result = await conditionalUpdate('products', id, fields, values);

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
 * Eyðir vöru
 *
 * @param {number} id Id vöru
 * @returns {array} Fylki með vöru
 */
async function deleteProduct(id) {
  const result = await query(`DELETE FROM products WHERE id = ${id} RETURNING *`);
  return result.rows[0];
}

module.exports = {
  getProducts,
  getProductById,
  getProductByTitle,
  createProduct,
  updateProduct,
  deleteProduct,
};
