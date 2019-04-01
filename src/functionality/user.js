require('dotenv').config();

const bcrypt = require('bcrypt');
const xss = require('xss');
const jwt = require('jsonwebtoken');

const { query, paged, conditionalUpdate } = require('../database/db');
const { validateUser } = require('./validate');

/**
 * Sækir notendur.
 *
 * @param offset Hvaða notanda á að byrja á
 * @param limit Hversu marga notendur á að ná í
 * @returns {array} Fylki af notendum
 */
async function getUsers({ offset = 0, limit = 10 }) {
  const result = await paged('SELECT id, username, email, admin FROM users ORDER BY id', { offset, limit });
  return result.rows;
}

/**
 * Sækir notanda eftir id.
 *
 * @param {number} id Id fyrir notanda
 * @returns {object} Notandi ef fundinn, annars tómt
 */
async function getUserById(id) {
  const result = await query(`SELECT id, username, email, admin FROM users WHERE id = ${id}`);
  return result.rows[0];
}

/**
 * Sækir notanda eftir netfangi.
 *
 * @param {string} email netfang
 * @returns {object} Notandi ef fundinn, annars tómt
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
 * @returns {object} Notandinn sem var breyttur
 */
async function changeUserAdmin(id, changeTo, userId) {
  // Ekki leyfa notanda að breyta sjálfum sér
  if (id === userId) {
    return {
      selfDestruct: true,
      success: false,
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
 * @returns {object} Notandinn sem var búinn til
 */
async function createUser(username, email, password) {
  const validation = validateUser({ username, email, password }, false);
  if (validation.length > 0) {
    return {
      success: false,
      validation,
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
      alreadyExists: true,
      validation: [],
    };
  }

  const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET);
  return {
    success: true,
    alreadyExists: false,
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
 * @returns {object} Notandinn sem var breyttur
 */
async function updateUser(userId, email, password) {
  const validation = validateUser({ email, password }, true);

  if (validation.length > 0) {
    return {
      success: false,
      validation,
    };
  }

  const values = [
    email ? xss(email) : null,
    password ? await hashPassword(xss(password)) : null,
  ]
    .filter(Boolean);

  const fields = [
    email ? 'email' : null,
    password ? 'password' : null,
  ]
    .filter(Boolean);

  const result = await conditionalUpdate('users', userId, fields, values);

  if (result.rowCount === 0) {
    return {
      success: false,
      notFound: true,
      validation: [],
    };
  }

  const item = result.rows[0];
  delete item.password;

  return {
    success: true,
    notFound: false,
    validation: [],
    item,
  };
}

/**
 * Ber saman tvö lykilorð.
 *
 * @param {string} password Lykilorð sem þarf að athuga
 * @param {string} user Lykilorð notanda í gagnagrunni
 * @returns {boolean} Satt ef lykilorð er rétt, ósatt annars
 */
async function comparePasswords(password, userPass) {
  const ok = await bcrypt.compare(password, userPass);
  return ok;
}

module.exports = {
  getUsers,
  getUserById,
  getUserByEmail,
  changeUserAdmin,
  createUser,
  updateUser,
  comparePasswords,
};
