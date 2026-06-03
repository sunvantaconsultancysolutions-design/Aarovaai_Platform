const { readJSON } = require('../utils/fileStorage');
const progressService = require('./progress.service');
const testService = require('./test.service');
const authService = require('./auth.service');

const HISTORY_FILE = 'testHistory.json';

function getDashboard(userId) {
  const user = authService.getById(userId);
  const history = readJSON(HISTORY_FILE, []).filter(t => t.userId === userId);
  const summary = progressService.getSummary(userId);
  const streak = progressService.getStreakData(userId);
  const rings = progressService.getRings(userId);

  const testHistory = history.filter(t => t.mode !== 'practice');
  const practiceHistory = history.filter(t => t.mode === 'practice');

  const totalTests = testHistory.length;
  const totalPractices = practiceHistory.length;
  const allScores = history.map(t => t.score);
  const avgScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
  const bestScore = allScores.length ? Math.max(...allScores) : 0;
  const allAccuracies = history.map(t => t.accuracy);
  const avgAccuracy = allAccuracies.length ? Math.round(allAccuracies.reduce((a, b) => a + b, 0) / allAccuracies.length) : 0;

  // Total questions attempted
  const questionsAttempted = history.reduce((s, t) => s + (t.total || 0), 0);
  const totalTimeSeconds = history.reduce((s, t) => s + (t.timeTaken || 0), 0);
  const totalTimeHours = Math.round(totalTimeSeconds / 3600);

  // Weekly rank (simple: sort all users by weekly points)
  const weeklyRank = _getWeeklyRank(userId);

  return {
    user: { name: user.name, email: user.email, profileImage: user.profileImage, initials: user.name.slice(0, 2).toUpperCase() },
    stats: {
      totalTopics: summary.total,
      topicsStarted: summary.started,
      topicsCompleted: summary.completed,
      totalTests,
      totalPractices,
      avgScore,
      bestScore,
      avgAccuracy,
      questionsAttempted,
      totalTimeHours,
      currentStreak: streak.current,
      bestStreak: streak.best,
      activeDays: streak.activeDays,
      weeklyRank,
      syllabusCovered: summary.overallPct
    },
    rings
  };
}

function getActivity(userId, limit = 5, category = null) {
  let history = readJSON(HISTORY_FILE, [])
    .filter(t => t.userId === userId);

  if (category) {
    const topicService = require('./topic.service');
    history = history.filter(t => {
      const topic = topicService.MASTER_TOPICS.find(mt => mt.id === t.topicId);
      return topic && topic.category === category;
    });
  }

  history = history
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  return history.map(t => {
    const date = new Date(t.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - date) / 86400000);
    const timeLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    const mins = Math.round((t.timeTaken || 0) / 60);
    const scoreColor = t.score >= 75 ? 'var(--gr)' : t.score >= 55 ? 'var(--am)' : 'var(--rd)';

    return {
      testId: t.testId,
      name: `${t.topicName || t.topicId} — ${t.mode === 'practice' ? 'Practice' : 'Test'}`,
      icon: '📊',
      date: timeLabel,
      time: mins > 0 ? `${mins} min` : '< 1 min',
      score: t.score,
      scoreColor
    };
  });
}

function getLeaderboard(userId, { period = 'week', limit = 10, category = null } = {}) {
  // Build from all users' test history
  const allHistory = readJSON(HISTORY_FILE, []);
  const usersFile = readJSON('users.json', []);

  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const cutoff = new Date(Date.now() - days * 86400000);

  const topicService = require('./topic.service');
  const pointsMap = {};
  allHistory
    .filter(t => {
      const isRecent = new Date(t.createdAt) >= cutoff;
      if (!isRecent) return false;
      if (category) {
        const topic = topicService.MASTER_TOPICS.find(mt => mt.id === t.topicId);
        return topic && topic.category === category;
      }
      return true;
    })
    .forEach(t => {
      pointsMap[t.userId] = (pointsMap[t.userId] || 0) + (t.points || t.score * 10);
    });

  const board = Object.entries(pointsMap)
    .map(([uid, pts]) => {
      const u = usersFile.find(u => u.id === uid);
      return { userId: uid, name: u ? u.name : 'User', initials: u ? u.name.slice(0, 2).toUpperCase() : 'U', points: pts };
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);

  // Find current user's rank
  const allSorted = Object.entries(pointsMap).sort((a, b) => b[1] - a[1]);
  const myRank = allSorted.findIndex(([uid]) => uid === userId) + 1;
  const myPoints = pointsMap[userId] || 0;

  return { leaderboard: board, myRank: myRank || '—', myPoints };
}

function getBadges(userId) {
  const history = readJSON(HISTORY_FILE, []).filter(t => t.userId === userId);
  const streak = progressService.getStreakData(userId);
  const summary = progressService.getSummary(userId);
  const totalCorrect = history.reduce((s, t) => s + (t.correct || 0), 0);
  const allScores = history.map(t => t.score);
  const maxScore = allScores.length ? Math.max(...allScores) : 0;

  const BADGES = [
    { id: 'on-fire', icon: '🔥', name: 'On Fire', desc: '7-day streak', earned: streak.current >= 7 },
    { id: 'sharpshooter', icon: '🎯', name: 'Sharpshooter', desc: '90%+ in any test', earned: maxScore >= 90 },
    { id: 'speed-demon', icon: '⚡', name: 'Speed Demon', desc: 'Complete 10 tests', earned: history.length >= 10 },
    { id: 'perfect', icon: '💯', name: 'Perfect Score', desc: '100% in a test', earned: maxScore >= 100 },
    { id: 'top100', icon: '🏆', name: 'Top 100', desc: 'Take 5 tests', earned: history.length >= 5 },
    { id: 'scholar', icon: '📚', name: 'Scholar', desc: '500+ questions done', earned: totalCorrect >= 500 },
    { id: 'allrounder', icon: '🌟', name: 'All-Rounder', desc: 'Complete 10 topics', earned: summary.completed >= 10, locked: true },
    { id: 'graduated', icon: '🎓', name: 'Graduated', desc: 'Complete all topics', earned: summary.completed >= 32, locked: true },
    { id: 'launchpad', icon: '🚀', name: 'Launchpad', desc: '14-day streak', earned: streak.best >= 14, locked: true },
    { id: 'diamond', icon: '💎', name: 'Diamond', desc: '80%+ avg accuracy', earned: false, locked: true },
    { id: 'brainiac', icon: '🧠', name: 'Brainiac', desc: '100% hard accuracy', earned: false, locked: true },
    { id: 'champion', icon: '👑', name: 'Champion', desc: 'Rank #1 in a week', earned: false, locked: true },
  ];

  return BADGES.map(b => ({ ...b, locked: b.locked && !b.earned }));
}

function _getWeeklyRank(userId) {
  const allHistory = readJSON(HISTORY_FILE, []);
  const cutoff = new Date(Date.now() - 7 * 86400000);
  const pointsMap = {};
  allHistory.filter(t => new Date(t.createdAt) >= cutoff).forEach(t => {
    pointsMap[t.userId] = (pointsMap[t.userId] || 0) + (t.points || t.score * 10);
  });
  const sorted = Object.entries(pointsMap).sort((a, b) => b[1] - a[1]);
  const rank = sorted.findIndex(([uid]) => uid === userId) + 1;
  return rank || '—';
}

module.exports = { getDashboard, getActivity, getLeaderboard, getBadges };
