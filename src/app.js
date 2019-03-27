require('dotenv').config();

const path = require('path');
const express = require('express');

const jwt = require('jsonwebtoken');
const passport = require('passport');
const { Strategy } = require('passport-local');

const { strat } = require('./actions/user');

const users = require('./routes/user');
const { preventSecondLogin } = require('./utils');

const jwtSecret = process.env.JWT_SECRET;
const jwtAdminSecret = process.env.JWT_ADMIN_SECRET;

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  next();
});

// Notum local strategy með sér stratti
passport.use(new Strategy(strat));

app.use(passport.initialize());

// Login virkni
app.post(
  '/users/login',
  preventSecondLogin,
  passport.authenticate('local', { session: false }),
  (req, res) => {
    let token = jwt.sign({ id: req.user.id }, jwtSecret);
    if (req.user.admin) {
      token = jwt.sign({ id: req.user.id }, jwtAdminSecret);
    }
    res.status(200).json({ username: req.user.username, email: req.user.email, token });
  },
);

// Logout virkni
app.get('/users/logout', (req, res) => {
  req.logout();
  return res.status(200).json({ message: 'logout successful', token: null });
});

app.use(users);

function notFoundHandler(req, res, next) { // eslint-disable-line
  console.warn('Not found', req.originalUrl);
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) { // eslint-disable-line
  console.error(err);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid json' });
  }

  return res.status(500).json({ error: 'Internal server error' });
}

app.use(notFoundHandler);
app.use(errorHandler);

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;

app.listen(port, hostname, () => {
  console.info(`Server running at http://${hostname}:${port}/`);
});
