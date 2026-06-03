const { asyncHandler } = require('../middleware/error.middleware');
const dashboardService = require('../services/dashboard.service');

const dashboard = asyncHandler(async (req, res) => {
  const data = dashboardService.getDashboard(req.user.id);
  res.json({ success: true, ...data });
});

const activity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const { category } = req.query;
  const items = dashboardService.getActivity(req.user.id, limit, category);
  res.json({ success: true, activity: items });
});

const leaderboard = asyncHandler(async (req, res) => {
  const { period, limit, category } = req.query;
  const data = dashboardService.getLeaderboard(req.user.id, { period, limit: parseInt(limit) || 10, category });
  res.json({ success: true, ...data });
});

const badges = asyncHandler(async (req, res) => {
  const data = dashboardService.getBadges(req.user.id);
  res.json({ success: true, badges: data });
});

module.exports = { dashboard, activity, leaderboard, badges };
