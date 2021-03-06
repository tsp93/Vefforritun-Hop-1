const {
  getUsers,
  getUserById,
  changeUserAdmin,
  createUser,
  updateUser,
} = require('../functionality/user');

/**
 * Route handler til að ná í notendur
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} Hlutur með notendum
 */
async function getUsersRoute(req, res) {
  const { offset = 0, limit = 10 } = req.query;
  const result = await getUsers({ offset, limit });

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
 * @returns {object} Hlutur með notanda
 */
async function getUserRoute(req, res) {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'User not found' });
  }

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
 * @returns {object} Hlutur með notendanum sem var breyttur
 */
async function changeAdminRoute(req, res) {
  const { id } = req.params;
  const { changeTo } = req.body;
  const userId = req.user.id;

  if (!Number.isInteger(Number(id))) {
    return res.status(404).json({ error: 'User not found' });
  }

  const result = await changeUserAdmin(id, changeTo, userId);

  if (!result.success && result.selfDestruct) {
    return res.status(403).json({ error: 'Cannot demote self' });
  }

  if (!result.success && result.invalidChangeTo) {
    return res.status(403).json({ error: 'changeTo value must be true or false' });
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
 * @returns {object} Hlutur með notendanum sem var búinn til
 */
async function createUserRoute(req, res) {
  const { username, email, password } = req.body;
  const result = await createUser(username, email, password);

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  if (!result.success && result.alreadyExists) {
    return res.status(409).json({ error: 'User already exists' });
  }

  return res.status(201).json({ email: result.item.email, token: result.token });
}

/**
 * Route handler fyrir notanda til að ná í sig
 *
 * @param {object} req Request hlutur
 * @param {object} res Response hlutur
 * @returns {object} Hlutur með núverandi notanda
 */
async function getMeRoute(req, res) {
  const { id } = req.user;
  const result = await getUserById(id);

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
 * @returns {object} Hlutur með uppfærðum núverandi notanda
 */
async function changeMeRoute(req, res) {
  const { email, password } = req.body;
  const { id } = req.user;
  const result = await updateUser(id, email, password);

  if (!result.success && result.validation.length > 0) {
    return res.status(400).json(result.validation);
  }

  if (!result.success && result.notFound) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.status(200).json(result.item);
}

module.exports = {
  getUsersRoute,
  getUserRoute,
  changeAdminRoute,
  createUserRoute,
  getMeRoute,
  changeMeRoute,
};
