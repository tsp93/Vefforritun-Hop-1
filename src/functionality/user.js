require('dotenv').config();

const bcrypt = require('bcrypt');
const xss = require('xss');
const jwt = require('jsonwebtoken');

const { query } = require('../database/db');
const { validateUser } = require('./validate');

/**
 * @typedef {object} User
 * @property {string} username Notendanafn
 * @property {string} email Netfang notanda
 * @property {boolean} admin Segir til hvort notandi sé stjórnandi
 */

/**
 * @typedef {object} Result
 * @property {boolean} success Hvort aðgerð hafi tekist
 * @property {boolean} notFound Hvort hlutur hafi fundist
 * @property {array} validation Fylki af villum, ef einhverjar
 * @property {UserItem} item User item
 */

/**
 * Sækir alla notendur.
 *
 * @returns {array} Fylki af öllum notendum
 */
async function getAllUsers() {
  const result = await query('SELECT id, username, email, admin FROM users ORDER BY id');
  return result.rows;
}

/**
 * Sækir notanda eftir id.
 *
 * @param {number} id Id fyrir notanda
 * @returns {array} Notandi ef fundinn, annars tómt
 */
async function getUserById(id) {
  const result = await query(`SELECT id, username, email, admin FROM users WHERE id = ${id}`);
  return result.rows[0];
}

/**
 * Sækir notanda eftir netfangi.
 *
 * @param {string} email netfang
 * @returns {array} Notandi ef fundinn, annars tómt
 */
async function getUserByEmail(email) {
  const result = await query(`SELECT id, username, password, email, admin FROM users WHERE email = '${email}'`);
  return result.rows[0];
}

/**
 * Gerir notanda að stjórnanda eða gerir stjórnanda að venjulegum
 * notanda. Stjórnandi má ekki gera sjálfan sig að notanda.
 *
 * @param {number} id Id fyrir notanda sem á að breyta
 * @param {boolean} changeTo Admin gildi sem notandi á að fá
 * @param {number} userId Id fyrir notandann sem er að breyta
 *
 * @returns {array} Notandinn sem var breyttur
 */
async function changeUserAdmin(id, changeTo, userId) {
  // Ekki leyfa notanda að breyta sjálfum sér
  if (id === userId) {
    return {
      selfDestruct: true,
      success: false,
      notFound: false,
      item: null,
    };
  }

  const result = await query(`
  UPDATE users SET admin = ${changeTo} WHERE id = ${id}
  RETURNING id, username, admin`);

  if (result.rowCount === 0) {
    return {
      selfDestruct: false,
      success: false,
      notFound: true,
      item: null,
    };
  }
  return {
    selfDestruct: false,
    success: true,
    notFound: false,
    item: result.rows[0],
  };
}

/**
 * Hashar lykilorð með bcrypt
 *
 * @param {string} password Lykilorð til að hasha
 *
 * @returns {string} Hashað lykilorð
 */
async function hashPassword(password) {
  const hashedPassword = await bcrypt.hash(password, 11);
  return hashedPassword;
}

/**
 * Býr til notanda. Lykilorð er hashað.
 *
 * @param {string} username Notendanafn
 * @param {string} email Netfang
 * @param {string} password Lykilorð
 *
 * @returns {array} Notandinn sem var búinn til
 */
async function createUser(username, email, password) {
  const validation = validateUser({ username, email, password }, false);
  if (validation.length > 0) {
    return {
      success: false,
      notFound: false,
      validation,
      item: null,
    };
  }

  const user = {
    username: xss(username),
    email: xss(email),
    password: xss(password),
  };

  const hashedPassword = await hashPassword(user.password);

  const q = `
  INSERT INTO users (username, email, password)
  VALUES ($1, $2, $3)
  RETURNING id, email`;
  const values = [user.username, user.email, hashedPassword];
  let result;
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
  const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET);
  return {
    success: true,
    notFound: false,
    validation: [],
    item: result.rows[0],
    token,
  };
}

/**
 * Uppfærir netfang og/eða lykilorð.
 *
 * @param {number} userId Id fyrir notanda sem á að breyta
 * @param {string} email Nýtt netfang
 * @param {string} password Nýtt lykilorð
 *
 * @returns {array} Notandinn sem var breyttur
 */
async function updateUser(userId, email, password) {
  const validation = validateUser({ email, password }, true);

  if (validation.length > 0) {
    return {
      success: false,
      validation,
    };
  }

  const filteredValues = [
    email ? xss(email) : null,
    password ? await hashPassword(xss(password)) : null,
  ]
    .filter(Boolean);

  const updates = [
    email ? 'email' : null,
    password ? 'password' : null,
  ]
    .filter(Boolean)
    .map((field, i) => `${field} = $${i + 2}`);

  const q = `
    UPDATE users
    SET ${updates} WHERE id = $1
    RETURNING id, username, email`;
  const values = [userId, ...filteredValues];

  const result = await query(q, values);

  if (result.rowCount === 0) {
    return {
      success: false,
      validation: [],
      notFound: true,
      item: null,
    };
  }

  return {
    success: true,
    validation: [],
    notFound: false,
    item: result.rows[0],
  };
}

/**
 * Ber saman tvö lykilorð.
 *
 * @param {string} password Lykilorð sem þarf að athuga
 * @param {string} user Lykilorð notanda í gagnagrunni
 *
 * @returns {boolean} Satt ef lykilorð er rétt, ósatt annars
 */
async function comparePasswords(password, userPass) {
  const ok = await bcrypt.compare(password, userPass);
  return ok;
}

module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  changeUserAdmin,
  createUser,
  updateUser,
  comparePasswords,
};
