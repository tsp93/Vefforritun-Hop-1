/**
 * Higher-order fall sem umlykur async middleware með villumeðhöndlun.
 *
 * @param {function} fn Middleware sem grípa á villur fyrir
 * @returns {function} Middleware með villumeðhöndlun
 */
function catchErrors(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// Hjálpar middleware til að athuga hvort notandi sé stjórnandi
function isAdmin(req, res, next) {
  const { admin } = req.user;
  if (admin) {
    return next();
  }
  return res.status(403).json({ error: 'Not an admin' });
}

// Hjálpar middleware sem athugar hvort notandi sé innskráður og hleypir okkur
// þá áfram, annars gefur error
function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Please log in' });
}

// Koma í veg fyrir að innskráðir notendur fari á login og register
function preventSecondLogin(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/applications');
  }
  return next();
}

module.exports = {
  catchErrors,
  isAdmin,
  ensureLoggedIn,
  preventSecondLogin,
};
