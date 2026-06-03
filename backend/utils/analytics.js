/**
 * Analytics utility — computes user analytics from raw progress & test data.
 */

/**
 * Build accuracy trend from test history (last N days).
 */
function buildAccuracyTrend(testHistory, days = 30) {
  const now = new Date();
  const cutoff = new Date(now - days * 86400000);
  const dayMap = {};

  testHistory
    .filter(t => new Date(t.createdAt) >= cutoff)
    .forEach(t => {
      const d = t.createdAt.slice(0, 10);
      if (!dayMap[d]) dayMap[d] = { scores: [], count: 0 };
      dayMap[d].scores.push(t.score);
      dayMap[d].count++;
    });

  // Fill in dates
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 86400000);
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dayMap[key]) {
      const avg = Math.round(dayMap[key].scores.reduce((a, b) => a + b, 0) / dayMap[key].scores.length);
      result.push({ date: key, label, accuracy: avg, count: dayMap[key].count });
    } else {
      result.push({ date: key, label, accuracy: null, count: 0 });
    }
  }

  // Remove leading nulls for chart
  const firstData = result.findIndex(r => r.accuracy !== null);
  return firstData >= 0 ? result.slice(firstData) : result.slice(-11);
}

/**
 * Build heatmap data from daily activity (last ~60 days).
 */
function buildHeatmap(dailyActivity) {
  const today = new Date();
  const result = {};

  for (let i = 59; i >= 0; i--) {
    const date = new Date(today - i * 86400000);
    const key = date.toISOString().slice(0, 10);
    result[key] = dailyActivity[key] || 0;
  }
  return result;
}

/**
 * Calculate current and best streak from daily activity.
 */
function calculateStreak(dailyActivity) {
  const today = new Date();
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  const days = [];
  for (let i = 0; i < 365; i++) {
    const date = new Date(today - i * 86400000);
    days.push(date.toISOString().slice(0, 10));
  }

  // Current streak (going backwards from today)
  for (let i = 0; i < days.length; i++) {
    if (dailyActivity[days[i]] > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Best streak (all time)
  const sortedDays = Object.keys(dailyActivity).filter(d => dailyActivity[d] > 0).sort();
  for (let i = 0; i < sortedDays.length; i++) {
    const prev = i > 0 ? sortedDays[i - 1] : null;
    if (prev && (new Date(sortedDays[i]) - new Date(prev)) === 86400000) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;
  }

  const activeDays = Object.values(dailyActivity).filter(v => v > 0).length;
  return { current: currentStreak, best: Math.max(bestStreak, currentStreak), activeDays };
}

/**
 * Identify weak and strong areas from topic progress.
 */
function getWeakAndStrong(topicProgress) {
  const topics = Object.entries(topicProgress)
    .filter(([, data]) => data.done > 0)
    .map(([id, data]) => ({ id, name: data.name || id, accuracy: data.accuracy || 0 }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const weak = topics.slice(0, 4);
  const strong = topics.slice(-4).reverse();
  return { weak, strong };
}

module.exports = { buildAccuracyTrend, buildHeatmap, calculateStreak, getWeakAndStrong };
