const express = require('express');

const { catchErrors, isAdmin, ensureLoggedIn } = require('../utils');
const {
  getAllUsers,
  getUserById,
  changeUserAdmin,
  createUser,
} = require('../actions/user');

const router = express.Router();

async function getAllUsersRoute(req, res) {
  const result = await getAllUsers();
  return res.json(result);
}

async function getUserRoute(req, res) {
  const { userId } = req.query;
  const result = await getUserById(userId);

  return res.json(result);
}

async function changeAdminRoute(req, res) {
  const { id, changeTo } = req.query;
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

async function createUserRoute(req, res) {
  const { username, email, password } = req.body;
  const result = await createUser(username, email, password);

  if (!result.success) {
    return res.status(400).json(result.validation);
  }

  return res.status(201).json(result.item);
}

router.get('/users/', ensureLoggedIn, isAdmin, catchErrors(getAllUsersRoute));
router.get('/users/:id', ensureLoggedIn, isAdmin, catchErrors(getUserRoute));
router.patch('/users/:id', ensureLoggedIn, isAdmin, catchErrors(changeAdminRoute));
router.post('/users/:id', ensureLoggedIn, isAdmin, catchErrors(createUserRoute));

module.exports = router;
