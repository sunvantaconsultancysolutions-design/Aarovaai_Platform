const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../utils/fileStorage');
const { calculateScore, getResultTitle, calculatePoints } = require('../utils/scoreCalculator');

const HISTORY_FILE = 'testHistory.json';
const PROGRESS_FILE = 'progress.json';
const SAVED_FILE = 'savedTests.json';

function getHistory() { return readJSON(HISTORY_FILE, []); }
function getProgress() { return readJSON(PROGRESS_FILE, {}); }
function getSaved() { return readJSON(SAVED_FILE, []); }

/**
 * Submit a completed test → save result, update user progress.
 */
function submitTest(userId, { topicId, topicName, questions, answers, timeTaken, mode }) {
  const result = calculateScore(questions, answers);
  const points = calculatePoints(result.correct, result.total, timeTaken, questions.length * 90);

  const testRecord = {
    testId: uuidv4(),
    userId,
    topicId,
    topicName: topicName || topicId,
    score: result.score,
    accuracy: result.accuracy,
    correct: result.correct,
    wrong: result.wrong,
    skipped: result.skipped,
    total: result.total,
    timeTaken,
    mode: mode || 'test',
    byDifficulty: result.byDifficulty,
    points,
    answers: answers.map((a, i) => ({
      questionId: questions[i]?.id || i,
      question: questions[i]?.question,
      options: questions[i]?.options,
      correct_answer: questions[i]?.correct_answer,
      userAnswer: a !== null && a !== -1 ? questions[i]?.options?.[a] : null,
      answerIndex: a,
      correctIndex: questions[i]?.answer,
      explanation: questions[i]?.explanation,
      isCorrect: a === questions[i]?.answer,
      skipped: a === null || a === -1
    })),
    createdAt: new Date().toISOString()
  };

  // Save test record
  const history = getHistory();
  history.push(testRecord);
  writeJSON(HISTORY_FILE, history);

  // Update user progress
  _updateProgress(userId, topicId, topicName, testRecord);

  return { ...testRecord, title: getResultTitle(result.score) };
}

function _updateProgress(userId, topicId, topicName, testRecord) {
  const allProgress = getProgress();
  if (!allProgress[userId]) {
    allProgress[userId] = { topics: {}, dailyActivity: {}, totalTime: 0, bookmarks: [] };
  }
  const userProg = allProgress[userId];

  // Topic-level update
  if (!userProg.topics[topicId]) {
    userProg.topics[topicId] = { name: topicName, done: 0, accuracy: 0, timeSpent: 0, testCount: 0 };
  }
  const tp = userProg.topics[topicId];
  tp.name = topicName || topicId;
  tp.done = Math.min(100, (tp.done || 0) + testRecord.total);
  // Weighted rolling accuracy
  const prevTests = tp.testCount || 0;
  tp.accuracy = prevTests > 0
    ? Math.round((tp.accuracy * prevTests + testRecord.accuracy) / (prevTests + 1))
    : testRecord.accuracy;
  tp.timeSpent = (tp.timeSpent || 0) + (testRecord.timeTaken || 0);
  tp.testCount = prevTests + 1;

  // Daily activity
  const today = new Date().toISOString().slice(0, 10);
  userProg.dailyActivity[today] = (userProg.dailyActivity[today] || 0) + testRecord.total;
  userProg.totalTime = (userProg.totalTime || 0) + (testRecord.timeTaken || 0);

  writeJSON(PROGRESS_FILE, allProgress);
}

/**
 * Auto-save in-progress test.
 */
function saveTest(userId, { topicId, answers, currentQuestion, remaining }) {
  const saved = getSaved().filter(s => !(s.userId === userId && s.topicId === topicId));
  saved.push({ userId, topicId, answers, currentQuestion, remaining, savedAt: new Date().toISOString() });
  writeJSON(SAVED_FILE, saved);
  return { success: true };
}

/**
 * Get saved (in-progress) test for a user+topic.
 */
function getResume(userId, topicId) {
  const saved = getSaved();
  return saved.find(s => s.userId === userId && s.topicId === topicId) || null;
}

/**
 * Get test history for a user.
 */
function getTestHistory(userId, { limit = 20, period, topicId } = {}) {
  let history = getHistory().filter(t => t.userId === userId);

  if (topicId) history = history.filter(t => t.topicId === topicId);

  if (period) {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 365;
    const cutoff = new Date(Date.now() - days * 86400000);
    history = history.filter(t => new Date(t.createdAt) >= cutoff);
  }

  history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return history.slice(0, limit);
}

/**
 * Get a single test result.
 */
function getTestResult(userId, testId) {
  const history = getHistory();
  const record = history.find(t => t.testId === testId && t.userId === userId);
  if (!record) return null;
  return { ...record, title: getResultTitle(record.score) };
}

module.exports = { submitTest, saveTest, getResume, getTestHistory, getTestResult };
