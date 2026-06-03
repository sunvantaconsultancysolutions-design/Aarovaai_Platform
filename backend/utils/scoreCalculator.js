/**
 * Calculate test score and analytics from answers array.
 */
function calculateScore(questions, answers) {
  let correct = 0, wrong = 0, skipped = 0;
  const byDifficulty = { Easy: { correct: 0, wrong: 0, total: 0 }, Medium: { correct: 0, wrong: 0, total: 0 }, Hard: { correct: 0, wrong: 0, total: 0 } };

  questions.forEach((q, i) => {
    const ans = answers[i];
    const diff = q.difficulty || q.d || 'Medium';

    if (!byDifficulty[diff]) byDifficulty[diff] = { correct: 0, wrong: 0, total: 0 };
    byDifficulty[diff].total++;

    if (ans === null || ans === undefined || ans === -1) {
      skipped++;
    } else if (ans === q.answer && ans !== undefined) {
      correct++;
      byDifficulty[diff].correct++;
    } else {
      wrong++;
      byDifficulty[diff].wrong++;
    }
  });

  const total = questions.length;
  const attempted = correct + wrong;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  return { correct, wrong, skipped, total, attempted, accuracy, score, byDifficulty };
}

/**
 * Generate result title based on score percentage.
 */
function getResultTitle(score) {
  if (score >= 90) return 'Outstanding! 🏆';
  if (score >= 75) return 'Excellent! 🌟';
  if (score >= 60) return 'Well Done! 🎉';
  if (score >= 45) return 'Good Effort! 👍';
  return 'Keep Practicing! 💪';
}

/**
 * Calculate leaderboard points from test result.
 * Base: 100 pts per correct. Bonus for speed and streak.
 */
function calculatePoints(correct, total, timeTaken, totalTime) {
  const basePoints = correct * 100;
  const timeBonus = timeTaken < totalTime * 0.5 ? Math.round(correct * 20) : 0;
  return basePoints + timeBonus;
}

module.exports = { calculateScore, getResultTitle, calculatePoints };
