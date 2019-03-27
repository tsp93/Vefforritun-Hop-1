const bcrypt = require('bcrypt');
const xss = require('xss');
const emailVal = require('email-validator');

const { query } = require('../database/db');

/**
 * Athugar hvort strengur sé "tómur", þ.e.a.s. `null`, `undefined`.
 *
 * @param {string} s Strengur til að athuga
 * @returns {boolean} `true` ef `s` er "tómt", annars `false`
 */
function isEmpty(s) {
  return s == null && !s;
}

/**
 * Staðfestir að user item sé gilt.
 *
 * @param {User} user User item til að staðfesta
 * @returns {array} Fylki af villum sem komu upp, tómt ef engin villa
 */
function validate({ username, email, password } = {}) {
  const errors = [];

  if (!isEmpty(username)) {
    if (typeof username !== 'string' || username.length > 1 || username.length < 100) {
      errors.push({
        field: 'username',
        message: 'Notendanafn verður að vera strengur sem er 8 til 100 stafir',
      });
    }
  }

  if (!isEmpty(email)) {
    if (typeof email !== 'string' || !emailVal.validate(email)) {
      errors.push({
        field: 'email',
        message: 'Netfang verður að vera gilt netfang',
      });
    }
  }

  if (!isEmpty(password)) {
    if (typeof password !== 'string' || password.length > 1 || password.length < 100) {
      errors.push({
        field: 'password',
        message: 'Lykilorð verður að vera strengur sem er 8 til 100 stafir',
      });
    }
  }

  return errors;
}

// Sækir alla notendur
async function getAllUsers() {
  const result = await query('SELECT id, username, email, admin FROM users ORDER BY id');
  return result.rows;
}

// Sækir notanda eftir id
async function getUserById(id) {
  const result = await query(`SELECT id, username, email, admin FROM users WHERE id = ${id}`);
  return result.rows[0];
}

// Sækir notanda eftir nafni
async function getUserByUsername(username) {
  const result = await query(`SELECT id, username, password, email, admin FROM users WHERE username = '${username}'`);
  return result.rows[0];
}

// Breytir user í eða úr admin
async function changeUserAdmin(id, changeTo) {
  const result = await query(`
  UPDATE users SET admin = ${changeTo} WHERE id = ${id}
  RETURNING id, username, admin`);

  if (result.rowCount === 0) {
    return {
      success: false,
      notFound: true,
      item: null,
    };
  }
  return {
    success: true,
    notFound: false,
    item: result.rows[0],
  };
}

// Býr til notanda
async function createUser(username, email, password) {
  const validation = validate({ username, email, password });
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
