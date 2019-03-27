const express = require('express');

const { catchErrors, isAdmin, ensureLoggedIn } = require('../utils');
const {
  getAllUsers,
  getUserById,
  changeUserAdmin,
  createUser,
  updateUser,
} = require('../actions/user');

const router = express.Router();

/**
 * Route handler til að ná í alla notendur
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki af notendum
 */
async function getAllUsersRoute(req, res) {
  const result = await getAllUsers();

  if (!result) {
    return res.status(404).json({ error: 'No users found' });
  }

  return res.status(200).json(result);
}

/**
 * Route handler til að ná í notanda
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki með notanda
 */
async function getUserRoute(req, res) {
  const { id } = req.params;
  const result = await getUserById(id);

  if (!result) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(200).json(result);
}

/**
 * Route handler til að breyta notanda í eða úr stjórnanda
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki með notendanum sem var breyttur
 */
async function changeAdminRoute(req, res) {
  const { id } = req.params;
  const { changeTo } = req.query;
  const { userId } = req.body;

  const result = await changeUserAdmin(id, changeTo, userId);

  if (!result.success && result.selfDestruct) {
    return res.status(403).json({ error: 'Cannot demote self' });
  }

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(200).json(result.item);
}

/**
 * Route handler til að búa til notanda
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki með notendanum sem var búinn til
 */
async function createUserRoute(req, res) {
  const { username, email, password } = req.body;
  const result = await createUser(username, email, password);

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  if (!result.success && result.notFound) {
    return res.status(409).json({ error: 'User already exists' });
  }

  return res.status(201).json({ email: result.item.email, token: result.token });
}

/**
 * Route handler fyrir notanda til að ná í sig
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki með núverandi notanda
 */
async function getMeRoute(req, res) {
  const { userId } = req.body;
  const result = await getUserById(userId);

  if (!result) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(200).json(result);
}

/**
 * Route handler fyrir notanda til að breyta sér
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {array} Fylki með núverandi notanda
 */
async function changeMeRoute(req, res) {
  const { email, password } = req.query;
  const { userId } = req.body;
  const result = await updateUser(userId, email, password);

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'Item not found' });
  }

  return res.status(200).json(result.item);
}

router.get('/users/me', ensureLoggedIn, catchErrors(getMeRoute));
router.patch('/users/me', ensureLoggedIn, catchErrors(changeMeRoute));
router.get('/users/', ensureLoggedIn, isAdmin, catchErrors(getAllUsersRoute));
router.get('/users/:id', ensureLoggedIn, isAdmin, catchErrors(getUserRoute));
router.patch('/users/:id', ensureLoggedIn, isAdmin, catchErrors(changeAdminRoute));
router.post('/users/register', catchErrors(createUserRoute));


module.exports = router;
