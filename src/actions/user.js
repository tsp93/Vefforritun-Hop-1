const bcrypt = require('bcrypt');
const xss = require('xss');
const fs = require('fs');
const util = require('util');
const emailVal = require('email-validator');

const readFileAsync = util.promisify(fs.readFile);

const { query } = require('../database/db');

/**
 * Athugar hvort lykilorð sé slæmt.
 *
 * @param {string} password Lykilorð til að athuga
 * @returns {boolean} Satt ef slæmt lykilorð, ósatt annars
 */
async function isBadPassword(password) {
  const badPasswords = await readFileAsync('./500worstPasswords.txt');
  return badPasswords.toString().split('\r\n').includes(password);
}

/**
 * Staðfestir að user item sé gilt.
 *
 * @param {User} user User item til að staðfesta
 * @returns {array} Fylki af villum sem komu upp, tómt ef engin villa
 */
async function validate({ username, email, password } = {}) {
  const errors = [];

  if (typeof username !== 'string' || username.length < 8 || username.length > 100) {
    errors.push({
      field: 'username',
      message: 'Notendanafn verður að vera strengur sem er 8 til 100 stafir',
    });
  }

  if (typeof email !== 'string' || !emailVal.validate(email)) {
    errors.push({
      field: 'email',
      message: 'Netfang verður að vera gilt netfang',
    });
  }

  if (typeof password !== 'string' || password.length < 4 || password.length > 100) {
    errors.push({
      field: 'password',
      message: 'Lykilorð verður að vera strengur sem er 4 til 100 stafir',
    });
  } else if (isBadPassword(password)) {
    errors.push({
      field: 'password',
      message: 'Veldu betra lykilorð',
    });
  }

  return errors;
}

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
 * Sækir notanda eftir notendanafni.
 *
 * @param {string} username Notendanafn
 * @returns {array} Notandi ef fundinn, annars tómt
 */
async function getUserByUsername(username) {
  const result = await query(`SELECT id, username, password, email, admin FROM users WHERE username = '${username}'`);
  return result.rows[0];
}

/**
 * Gerir notanda að stjórnanda eða gerir stjórnanda að venjulegum
 * notanda. Stjórnandi má ekki gera sjálfan sig að notanda.
 *
 * @param {number} id Id fyrir notanda
 * @param {boolean} changeTo Gildi sem notandi á að fá
 * @param {number} selfId Id fyrir stjórnandann sem er að breyta
 *
 * @returns {array} Notandinn sem var breyttur
 */
async function changeUserAdmin(id, changeTo, selfId) {
  if (id === selfId) {
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
 * Býr til notanda. Lykilorð er hashað.
 *
 * @param {string} username Notendanafn
 * @param {string} email Netfang
 * @param {string} password Lykilorð
 *
 * @returns {array} Notandinn sem var búinn til
 */
async function createUser(username, email, password) {
  const validation = await validate({ username, email, password });
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

  const hashedPassword = await bcrypt.hash(user.password, 11);

  const q = `
  INSERT INTO users (username, email, password)
  VALUES ($1, $2, $3)
  RETURNING id, email`;
  const values = [user.username, user.email, hashedPassword];
  const result = await query(q, values);

  if (result.rowCount === 0) {
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

/**
 * Ber saman tvö lykilorð.
 *
 * @param {string} password Lykilorð þess sem vill skrá sig inn
 * @param {User} user Notandi úr gagnagrunn
 *
 * @returns {boolean} Satt ef lykilorð er rétt, ósatt annars
 */
async function comparePasswords(password, user) {
  const ok = await bcrypt.compare(password, user.password);

  if (ok) {
    return user;
  }

  return false;
}

module.exports = {
  getAllUsers,
  getUserById,
  getUserByUsername,
  changeUserAdmin,
  createUser,
  comparePasswords,
};
