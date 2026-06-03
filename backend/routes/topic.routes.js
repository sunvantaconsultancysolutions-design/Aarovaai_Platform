const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/topic.controller');

router.get('/topics', optionalAuth, ctrl.getTopics);
router.get('/topics/stats', ctrl.getTopicStats);
router.get('/topics/:id', optionalAuth, ctrl.getOneTopic);
router.post('/topics/:id/bookmark', authenticate, ctrl.bookmark);
router.get('/categories/counts', ctrl.getCounts);

module.exports = router;
