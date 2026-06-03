const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/question.controller');

// ⚠️  /mock/random MUST be declared before /:topicId so Express doesn't treat "mock" as a topicId
router.get('/questions/mock/random', optionalAuth, ctrl.getMockQuestions);
router.get('/questions/:topicId', optionalAuth, ctrl.getQuestions);
router.get('/questions/:topicId/random', optionalAuth, ctrl.getRandomQuestions);

module.exports = router;
