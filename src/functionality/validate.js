const fs = require('fs');
const util = require('util');
const emailVal = require('email-validator');

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
 * Staðfestir að user item sé gilt.
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
        message: 'Notendanafn verður að vera strengur sem er 8 til 100 stafir',
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
        message: 'Lykilorð verður að vera strengur sem er 4 til 100 stafir',
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

module.exports = {
  validateUser,
};
