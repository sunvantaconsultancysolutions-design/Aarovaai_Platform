const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/test.controller');

router.post('/submit', authenticate, ctrl.submit);
router.post('/save', authenticate, ctrl.save);
router.get('/history', authenticate, ctrl.history);
router.get('/result/:testId', authenticate, ctrl.result);
router.get('/resume', authenticate, ctrl.resume);

module.exports = router;
