const express = require('express');
const passport = require('passport');
const { Strategy, ExtractJwt } = require('passport-jwt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const { getUserById, getUserByEmail, comparePasswords } = require('./api/user');
const { catchErrors } = require('./utils');

const jwtSecret = process.env.JWT_SECRET;
const jwtTokenLifetime = process.env.JWT_TOKEN_LIFETIME;

if (!jwtSecret) {
  console.error('JWT_SECRET not registered in .env');
  process.exit(1);
}

let tokenLifetime = '30d'; // 30 days

if (jwtTokenLifetime) {
  tokenLifetime = jwtTokenLifetime;
}

const stratOptions = {
  usernameField: 'email',
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtSecret,
};

/**
 * Strat fyrir passport
 *
 * @param {object} data Data hlutur
 * @param {function} next Kall í næsta middleware
 */
async function strat(data, next) {
  const user = await getUserById(data.id);

  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
}

passport.use(new Strategy(stratOptions, strat));

app.use(passport.initialize());

/**
 * Middleware sem passar upp á að token sé gilt
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Kall í næsta middleware
 * @returns {function} Næsta middleware eða villu
 */
function requireAuth(req, res, next) {
  return passport.authenticate(
    'jwt',
    { session: false },
    (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        const error = info && info.name === 'TokenExpiredError'
          ? 'expired token' : 'invalid token';

        return res.status(401).json({ error });
      }

      req.user = user;
      return next();
    },
  )(req, res, next);
}

/**
 * Middleware til að athuga hvort notandi sé stjórnandi
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @param {function} next Kall í næsta middleware
 * @returns {function} Næsta middleware eða villu
 */
async function isAdmin(req, res, next) {
  const { admin } = req.user;
  if (admin) {
    return next();
  }
  return res.status(403).json({ error: 'Not an admin' });
}

/**
 * Route handler login
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} JSON með notanda, token og líftíma token
 */
async function loginRoute(req, res) {
  const { email, password } = req.body;

  const user = await getUserByEmail(email);

  if (!user) {
    return res.status(401).json({ error: 'No such user' });
  }

  const passwordIsCorrect = await comparePasswords(password, user.password);

  if (passwordIsCorrect) {
    const payload = { id: user.id };
    const tokenOptions = { expiresIn: tokenLifetime };
    const token = jwt.sign(payload, stratOptions.secretOrKey, tokenOptions);

    delete user.password;

    return res.status(200).json({
      user,
      token,
      expiresIn: tokenLifetime,
    });
  }

  return res.status(401).json({ error: 'Invalid password!' });
}

app.post('/users/login', catchErrors(loginRoute));

module.exports = app;
module.exports.requireAuth = requireAuth;
module.exports.isAdmin = isAdmin;
