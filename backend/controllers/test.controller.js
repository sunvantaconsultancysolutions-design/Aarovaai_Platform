const { asyncHandler } = require('../middleware/error.middleware');
const testService = require('../services/test.service');

const submit = asyncHandler(async (req, res) => {
  const { topicId, topicName, questions, answers, timeTaken, mode } = req.body;
  if (!questions?.length || !answers?.length) {
    return res.status(400).json({ success: false, message: 'questions and answers are required' });
  }
  const result = testService.submitTest(req.user.id, { topicId, topicName, questions, answers, timeTaken, mode });
  res.json({ success: true, result });
});

const save = asyncHandler(async (req, res) => {
  const { topicId, answers, currentQuestion, remaining } = req.body;
  testService.saveTest(req.user.id, { topicId, answers, currentQuestion, remaining });
  res.json({ success: true, message: 'Progress saved' });
});

const history = asyncHandler(async (req, res) => {
  const { limit, period, topicId } = req.query;
  const tests = testService.getTestHistory(req.user.id, { limit: parseInt(limit) || 20, period, topicId });
  res.json({ success: true, count: tests.length, tests });
});

const result = asyncHandler(async (req, res) => {
  const record = testService.getTestResult(req.user.id, req.params.testId);
  if (!record) return res.status(404).json({ success: false, message: 'Test result not found' });
  res.json({ success: true, result: record });
});

const resume = asyncHandler(async (req, res) => {
  const saved = testService.getResume(req.user.id, req.query.topicId);
  res.json({ success: true, saved });
});

module.exports = { submit, save, history, result, resume };
