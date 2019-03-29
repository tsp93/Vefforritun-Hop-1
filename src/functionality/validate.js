const fs = require('fs');
const util = require('util');
const emailVal = require('email-validator');
const mime = require('mime');

const readFileAsync = util.promisify(fs.readFile);

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
 * Athugar hvort lykilorð sé slæmt.
 *
 * @param {string} password Lykilorð til að athuga
 * @returns {boolean} Satt ef slæmt lykilorð, ósatt annars
 */
async function isBadPassword(password) {
  try {
    const badPasswords = await readFileAsync('./500worstPasswords.txt');
    return badPasswords.toString().split('\r\n').includes(password);
  } catch (error) {
    console.error(error);
    return false;
  }
}

/**
 * Staðfestir notandi sé gildur.
 *
 * @param {User} user User item til að staðfesta
 * @param {boolean} patching Satt ef uppfæring á sér stað, annars ósatt
 * @returns {array} Fylki af villum sem komu upp, tómt ef engin villa
 */
function validateUser({ username, email, password } = {}, patching) {
  const errors = [];

  if (!isEmpty(username) || !patching) {
    if (typeof username !== 'string' || username.length < 8 || username.length > 100) {
      errors.push({
        field: 'username',
        message: 'Notendanafn verður að vera strengur sem er 8 til 32 stafir',
      });
    }
  }

  if (!isEmpty(email) || !patching) {
    if (typeof email !== 'string' || !emailVal.validate(email)) {
      errors.push({
        field: 'email',
        message: 'Netfang verður að vera gilt netfang',
      });
    }
  }

  if (!isEmpty(password) || !patching) {
    if (typeof password !== 'string' || password.length < 4 || password.length > 100) {
      errors.push({
        field: 'password',
        message: 'Lykilorð verður að vera strengur sem er 4 til 40 stafir',
      });
    } else if (!isBadPassword(password)) {
      errors.push({
        field: 'password',
        message: 'Veldu betra lykilorð',
      });
    }
  }

  return errors;
}

/**
 * Staðfestir að vara sé gild.
 *
 * @param {Product} product Product item til að staðfesta
 * @param {boolean} patching Satt ef uppfæring á sér stað, annars ósatt
 * @returns {array} Fylki af villum sem komu upp, tómt ef engin villa
 */
function validateProduct({
  title, description, imagepath, categoryId,
} = {}, patching) {
  const errors = [];

  if (!isEmpty(title) || !patching) {
    if (typeof title !== 'string') {
      errors.push({
        field: 'title',
        message: 'Titill verður að vera strengur',
      });
    }
  }

  if (!isEmpty(description) || !patching) {
    if (typeof description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Lýsing verður að vera strengur',
      });
    }
  }

  if (!isEmpty(imagepath) || !patching) {
    if (typeof imagepath !== 'string' || ['jpg', 'png', 'gif'].includes(mime.getExtension(imagepath))) {
      errors.push({
        field: 'imagepath',
        message: 'Mynd þarf að vera af eftirfarandi tegundum: jpg, png, gif',
      });
    }
  }

  if (!isEmpty(categoryId) || !patching) {
    if (typeof categoryId !== 'string' || Number(categoryId) < 0) {
      errors.push({
        field: 'categoryId',
        message: 'Verður að vera tala stærri en núll',
      });
    }
  }

  return errors;
}

module.exports = {
  validateUser,
  validateProduct,
};
