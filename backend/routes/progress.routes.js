const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/progress.controller');

router.get('/summary', authenticate, ctrl.summary);
router.get('/topics', authenticate, ctrl.topics);
router.get('/accuracy-trend', authenticate, ctrl.accuracyTrend);
router.get('/areas', authenticate, ctrl.areas);
router.get('/difficulty', authenticate, ctrl.difficulty);
router.get('/heatmap', authenticate, ctrl.heatmap);
router.get('/streak', authenticate, ctrl.streak);
router.get('/rings', authenticate, ctrl.rings);

module.exports = router;
