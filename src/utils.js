require('dotenv').config();
const jwt = require('jsonwebtoken');

/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

/**
 * Hjálpar middleware til að athuga hvort notandi sé stjórnandi
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Kall í næsta middleware
 * @returns {function} Næsta middleware eða villu
 */
function isAdmin(req, res, next) {
  const { admin } = req.body;
  if (admin) {
    return next();
  }
  return res.status(403).json({ error: 'Not an admin' });
}

/**
 * Fall til að athuga token
 *
 * @param {string} token JSON web token
 * @returns {object} Afkóðað token ef gilt token, annars null
 */
function isValidToken(token) {
  try {
    // Tékka hvort token sé frá venjulegum notanda
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    decoded.admin = false;
    return decoded;
  } catch (err) {
    try {
      // Tékka hvort token sé frá stjórnanda
      const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
      decoded.admin = true;
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Hjálpar middleware sem athugar hvort notandi sé innskráður
 * og kallar í næsta middleware ef svo, annars gefur villu
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Kall í næsta middleware
 * @returns {function} Næsta middleware eða villu
 */
function ensureLoggedIn(req, res, next) {
  const token = (req.body && req.body.token)
  || (req.query && req.query.token)
  || (req.headers.authorization && req.headers.authorization.slice(7));
  const valid = isValidToken(token);

  if (valid != null) {
    req.body.userId = valid.id;
    req.body.admin = valid.admin;
    return next();
  }
  return res.status(401).json({ error: 'Token is invalid' });
}

/**
 * Middleware til að koma í veg fyrir að innskráðir notendur skrái sig inn aftur
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Kall í næsta middleware
 * @returns {function} Næsta middleware eða villu
 */
function preventSecondLogin(req, res, next) {
  const token = (req.body && req.body.token)
  || (req.query && req.query.token)
  || (req.headers.authorization && req.headers.authorization.slice(7));

  if (!token) {
    return next();
  }
  return res.status(409).json({ error: 'Already logged in' });
}

module.exports = {
  catchErrors,
  isAdmin,
  ensureLoggedIn,
  preventSecondLogin,
};
