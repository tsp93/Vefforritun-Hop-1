const express = require('express');

const { catchErrors } = require('../utils');
const { requireAuth, isAdmin } = require('../auth');
const {
  getAllUsersRoute,
  getUserRoute,
  changeAdminRoute,
  createUserRoute,
  getMeRoute,
  changeMeRoute,
} = require('./user');

const router = express.Router();


router.get('/users/me', requireAuth, catchErrors(getMeRoute));
router.patch('/users/me', requireAuth, catchErrors(changeMeRoute));
router.get('/users/', requireAuth, isAdmin, catchErrors(getAllUsersRoute));
router.get('/users/:id', requireAuth, isAdmin, catchErrors(getUserRoute));
router.patch('/users/:id', requireAuth, isAdmin, catchErrors(changeAdminRoute));
router.post('/users/register', catchErrors(createUserRoute));

module.exports = router;
