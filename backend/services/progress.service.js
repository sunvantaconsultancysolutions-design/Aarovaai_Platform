const { readJSON, writeJSON } = require('../utils/fileStorage');
const { buildAccuracyTrend, buildHeatmap, calculateStreak, getWeakAndStrong } = require('../utils/analytics');
const topicService = require('./topic.service');

const PROGRESS_FILE = 'progress.json';
const HISTORY_FILE = 'testHistory.json';

function getUserProgress(userId) {
  const all = readJSON(PROGRESS_FILE, {});
  return all[userId] || { topics: {}, dailyActivity: {}, totalTime: 0, bookmarks: [] };
}

function getUserHistory(userId) {
  return readJSON(HISTORY_FILE, []).filter(t => t.userId === userId);
}

function getSummary(userId) {
  const prog = getUserProgress(userId);
  const topics = topicService.MASTER_TOPICS.filter(t => t.category === 'arithmetic');
  const started = topics.filter(t => prog.topics[t.id]?.done > 0).length;
  const completed = topics.filter(t => (prog.topics[t.id]?.done || 0) >= t.total).length;
  const totalDone = Object.values(prog.topics).reduce((s, t) => s + (t.done || 0), 0);
  const overallPct = topics.length > 0 ? Math.round((completed / topics.length) * 100) : 0;
  return { started, completed, total: topics.length, totalDone, overallPct };
}

function getTopicProgress(userId) {
  const prog = getUserProgress(userId);
  return topicService.getAllTopics(userId, { category: 'arithmetic' }).map(t => ({
    id: t.id,
    name: t.n,
    icon: t.e,
    done: t.done,
    total: t.total,
    accuracy: t.accuracy,
    status: t.status,
    color: t.col,
    timeSpent: prog.topics[t.id]?.timeSpent || 0
  }));
}

function getAccuracyTrend(userId, period = '30d') {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const history = getUserHistory(userId);
  return buildAccuracyTrend(history, days);
}

function getAreas(userId) {
  const prog = getUserProgress(userId);
  const topicMap = {};
  topicService.MASTER_TOPICS.forEach(t => { topicMap[t.id] = t.n; });
  const enriched = {};
  Object.entries(prog.topics).forEach(([id, data]) => {
    enriched[id] = { ...data, name: topicMap[id] || id };
  });
  return getWeakAndStrong(enriched);
}

function getDifficultyStats(userId) {
  const history = getUserHistory(userId);
  const stats = { Easy: { correct: 0, total: 0 }, Medium: { correct: 0, total: 0 }, Hard: { correct: 0, total: 0 } };
  history.forEach(test => {
    if (!test.byDifficulty) return;
    Object.entries(test.byDifficulty).forEach(([diff, d]) => {
      if (!stats[diff]) return;
      stats[diff].correct += d.correct || 0;
      stats[diff].total += d.total || 0;
    });
  });
  return {
    easy: stats.Easy.total > 0 ? Math.round((stats.Easy.correct / stats.Easy.total) * 100) : 0,
    medium: stats.Medium.total > 0 ? Math.round((stats.Medium.correct / stats.Medium.total) * 100) : 0,
    hard: stats.Hard.total > 0 ? Math.round((stats.Hard.correct / stats.Hard.total) * 100) : 0,
    totalCorrect: stats.Easy.correct + stats.Medium.correct + stats.Hard.correct,
    totalWrong: Object.values(stats).reduce((s, d) => s + (d.total - d.correct), 0),
  };
}

function getHeatmapData(userId) {
  const prog = getUserProgress(userId);
  return buildHeatmap(prog.dailyActivity || {});
}

function getStreakData(userId) {
  const prog = getUserProgress(userId);
  return calculateStreak(prog.dailyActivity || {});
}

function getRings(userId) {
  const prog = getUserProgress(userId);
  const history = getUserHistory(userId);
  const allAccuracies = history.map(t => t.accuracy);
  const avgAccuracy = allAccuracies.length ? Math.round(allAccuracies.reduce((a, b) => a + b, 0) / allAccuracies.length) : 0;

  const topics = topicService.MASTER_TOPICS.filter(t => t.category === 'arithmetic');
  const totalQuestions = topics.reduce((s, t) => s + t.total, 0);
  const doneQuestions = Object.values(prog.topics).reduce((s, t) => s + (t.done || 0), 0);
  const covered = totalQuestions > 0 ? Math.round((doneQuestions / totalQuestions) * 100) : 0;

  return {
    accuracy: avgAccuracy,
    covered: Math.min(100, covered),
    goal: Math.min(100, Math.round(covered * 0.8)) // 80% of covered as goal proxy
  };
}

module.exports = { getSummary, getTopicProgress, getAccuracyTrend, getAreas, getDifficultyStats, getHeatmapData, getStreakData, getRings };
