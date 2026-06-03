const { asyncHandler } = require('../middleware/error.middleware');
const topicService = require('../services/topic.service');

const getTopics = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { category, exam, status, difficulty, search } = req.query;
  const topics = topicService.getAllTopics(userId, { category, examType: exam, status, difficulty, search });
  res.json({ success: true, count: topics.length, topics });
});

const getTopicStats = asyncHandler(async (req, res) => {
  // Hero stats — kept static as platform-level marketing numbers
  res.json({
    success: true,
    stats: {
      totalQuestions: '3200+',
      totalTopics: 32,
      passRate: '94%',
      examTypes: 5
    }
  });
});

const getOneTopic = asyncHandler(async (req, res) => {
  const topic = topicService.getTopic(req.params.id, req.user?.id);
  if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
  res.json({ success: true, topic });
});

const bookmark = asyncHandler(async (req, res) => {
  const result = topicService.toggleBookmark(req.user.id, req.params.id);
  res.json({ success: true, ...result });
});

const getCounts = asyncHandler(async (req, res) => {
  const counts = topicService.getCategoryCounts();
  res.json({ success: true, counts });
});

module.exports = { getTopics, getTopicStats, getOneTopic, bookmark, getCounts };
