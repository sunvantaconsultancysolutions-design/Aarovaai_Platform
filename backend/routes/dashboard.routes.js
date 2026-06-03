const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/dashboard.controller');

router.get('/dashboard', authenticate, ctrl.dashboard);
router.get('/activity', authenticate, ctrl.activity);
router.get('/leaderboard', authenticate, ctrl.leaderboard);
router.get('/badges', authenticate, ctrl.badges);

module.exports = router;
