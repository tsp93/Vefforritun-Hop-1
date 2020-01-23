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

  if (patching && isEmpty(email) && isEmpty(password)) {
    errors.push({
      error: 'Vantar uppfært netfang og/eða lykilorð',
    });
  }

  if (!isEmpty(username) || !patching) {
    if (typeof username !== 'string' || username.length < 8 || username.length > 32) {
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
    if (typeof password !== 'string' || password.length < 4 || password.length > 40) {
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
  title, description, price, imagepath, categoryID,
} = {}, patching) {
  const errors = [];

  if (patching && isEmpty(title) && isEmpty(description) && isEmpty(price)
  && isEmpty(imagepath) && isEmpty(categoryID)) {
    errors.push({
      error: 'Vantar eitthvert uppfært gildi',
    });
  }

  if (!isEmpty(title) || !patching) {
    if (typeof title !== 'string' || title.length < 4 || title.length > 40) {
      errors.push({
        field: 'title',
        message: 'Titill verður að vera strengur sem er 4 til 40 stafir',
      });
    }
  }

  if (!isEmpty(description) || !patching) {
    if (typeof description !== 'string' || description.length < 4 || description.length > 255) {
      errors.push({
        field: 'description',
        message: 'Lýsing verður að vera strengur sem er 4 til 255 stafir',
      });
    }
  }

  if (!isEmpty(price) || !patching) {
    if (!Number.isInteger(Number(price)) || Number(price) < 1) {
      errors.push({
        field: 'price',
        message: 'Verð verður að vera heiltala stærri en núll',
      });
    }
  }

  if (!isEmpty(imagepath)) {
    if (typeof imagepath !== 'string' || ['jpg', 'png', 'gif'].includes(mime.getExtension(imagepath))) {
      errors.push({
        field: 'imagepath',
        message: 'Mynd þarf að vera af eftirfarandi tegundum: jpg, png, gif',
      });
    }
  }

  if (!isEmpty(categoryID) || !patching) {
    if (!Number.isInteger(Number(categoryID)) || Number(categoryID) < 1) {
      errors.push({
        field: 'categoryID',
        message: 'Verður að vera heiltala stærri en núll',
      });
    }
  }

  return errors;
}

/**
 * Staðfestir að flokkur sé gildur.
 *
 * @param {string} title Titill flokks
 * @param {boolean} patching Satt ef uppfæring á sér stað, annars ósatt
 * @returns {array} Fylki af villum sem komu upp, tómt ef engin villa
 */
function validateCategory(title) {
  const errors = [];

  if (typeof title !== 'string' || title.length < 4 || title.length > 40) {
    errors.push({
      field: 'title',
      message: 'Titill verður að vera strengur sem er 4 til 40 stafir',
    });
  }

  return errors;
}

/**
 * Staðfestir að lína sé gild.
 *
 * @param {Line} line Line item til að staðfesta
 * @param {boolean} patching Satt ef uppfæring á sér stað, annars ósatt
 * @returns {array} Fylki af villum sem komu upp, tómt ef engin villa
 */
function validateLine(productId, amount, patching) {
  const errors = [];

  if (!patching) {
    if (!Number.isInteger(Number(productId)) || Number(productId) < 1) {
      errors.push({
        field: 'productId',
        message: 'Verður að vera heiltala stærri en núll',
      });
    }
  }

  if (!Number.isInteger(Number(amount)) || Number(amount) < 1) {
    errors.push({
      field: 'amount',
      message: 'Fjöldi verður að vera heiltala stærri en núll',
    });
  }

  return errors;
}

/**
 * Staðfestir að pöntun sé gild.
 *
 * @param {Order} order Order item til að staðfesta
 * @returns {array} Fylki af villum sem komu upp, tómt ef engin villa
 */
function validateOrder(cartId, name, address, admin) {
  const errors = [];

  if (admin) {
    if (!Number.isInteger(Number(cartId)) || Number(cartId) < 1) {
      errors.push({
        field: 'cartId',
        message: 'Verður að vera heiltala stærri en núll',
      });
    }
  }

  if (typeof name !== 'string' || name.length < 4 || name.length > 40) {
    errors.push({
      field: 'name',
      message: 'Nafn verður að vera strengur sem er 4 til 64 stafir',
    });
  }

  if (typeof address !== 'string' || address.length < 4 || address.length > 100) {
    errors.push({
      field: 'address',
      message: 'Heimilisfang verður að vera strengur sem er 4 til 100 stafir',
    });
  }

  return errors;
}

module.exports = {
  validateUser,
  validateProduct,
  validateCategory,
  validateLine,
  validateOrder,
};
