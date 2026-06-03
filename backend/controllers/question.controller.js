const { asyncHandler } = require('../middleware/error.middleware');
const questionService = require('../services/question.service');

const getQuestions = asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const { difficulty, exam_type } = req.query;
  const questions = questionService.getQuestions(topicId, { difficulty, exam_type });
  if (!questions.length) return res.status(404).json({ success: false, message: 'No questions found for this topic' });
  res.json({ success: true, count: questions.length, topicId, questions });
});

const getRandomQuestions = asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const count = Math.min(parseInt(req.query.count) || 10, 100);
  const { difficulty, exam_type } = req.query;
  const questions = questionService.getRandomQuestions(topicId, count, { difficulty, exam_type });
  if (!questions.length) return res.status(404).json({ success: false, message: 'No questions found for this topic' });
  res.json({ success: true, count: questions.length, topicId, questions });
});

/**
 * GET /api/questions/mock/random
 * Returns mixed questions from all topics for the Full Mock Test.
 * Query: count (default 50), difficulty (optional)
 */
const getMockQuestions = asyncHandler(async (req, res) => {
  const count      = Math.min(parseInt(req.query.count) || 50, 200);
  const difficulty = req.query.difficulty;
  const questions  = questionService.getMockQuestions(count, { difficulty });
  if (!questions.length) {
    return res.status(404).json({ success: false, message: 'No questions available for mock test' });
  }
  res.json({ success: true, count: questions.length, mode: 'mock', questions });
});

module.exports = { getQuestions, getRandomQuestions, getMockQuestions };
