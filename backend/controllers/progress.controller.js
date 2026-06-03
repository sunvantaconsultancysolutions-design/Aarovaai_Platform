const { asyncHandler } = require('../middleware/error.middleware');
const progressService = require('../services/progress.service');

const summary = asyncHandler(async (req, res) => {
  res.json({ success: true, ...progressService.getSummary(req.user.id) });
});

const topics = asyncHandler(async (req, res) => {
  res.json({ success: true, topics: progressService.getTopicProgress(req.user.id) });
});

const accuracyTrend = asyncHandler(async (req, res) => {
  const { period } = req.query;
  res.json({ success: true, trend: progressService.getAccuracyTrend(req.user.id, period) });
});

const areas = asyncHandler(async (req, res) => {
  res.json({ success: true, ...progressService.getAreas(req.user.id) });
});

const difficulty = asyncHandler(async (req, res) => {
  res.json({ success: true, ...progressService.getDifficultyStats(req.user.id) });
});

const heatmap = asyncHandler(async (req, res) => {
  res.json({ success: true, heatmap: progressService.getHeatmapData(req.user.id) });
});

const streak = asyncHandler(async (req, res) => {
  res.json({ success: true, ...progressService.getStreakData(req.user.id) });
});

const rings = asyncHandler(async (req, res) => {
  res.json({ success: true, ...progressService.getRings(req.user.id) });
});

module.exports = { summary, topics, accuracyTrend, areas, difficulty, heatmap, streak, rings };
