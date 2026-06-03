const path = require('path');
const fs = require('fs');

// Path to the already-generated question files
const QUESTIONS_DIR = path.join(__dirname, '..', '..', 'aptitude-generation', 'outputs');

// Map topic IDs → actual filenames in the outputs folder
const TOPIC_FILE_MAP = {
  'percentage':             'Percentage.json',
  'profit-loss':            'Profit_and_Loss.json',
  'simple-interest':        'Simple_Interest.json',
  'compound-interest':      'Compound_Interest.json',
  'time-work':              'Time_and_Work.json',
  'time-distance':          'Time_and_Distance.json',
  'ratio-proportion':       'Ratio_and_Proportion.json',
  'average':                'Average.json',
  'probability':            'Probability.json',
  'permutation-combination':'Permutation_and_Combination.json',
  'hcf-lcm':                'HCF_and_LCM.json',
  'number-system':          'Numbers.json',
  'problems-trains':        'Problems_on_Trains.json',
  'boats-streams':          'Boats_and_Streams.json',
  'pipes-cistern':          'Pipes_and_Cistern.json',
  'ages':                   'Problems_on_Ages.json',
  'alligation-mixture':     'Alligation_or_Mixture.json',
  'partnership':            'Partnership.json',
  'calendar':               'Calendar.json',
  'clock':                  'Clock.json',
  'area':                   'Area.json',
  'volume-surface':         'Volume_and_Surface_Area.json',
  'height-distance':        'Height_and_Distance.json',
  'simplification':         'Simplification.json',
  'square-cube-roots':      'Square_Root_and_Cube_Root.json',
  'surds-indices':          'Surds_and_Indices.json',
  'logarithm':              'Logarithm.json',
  'chain-rule':             'Chain_Rule.json',
  'races-games':            'Races_and_Games.json',
  'stocks-shares':          'Stocks_and_Shares.json',
  'decimal-fractions':      'Decimal_Fraction.json',
  'bankers-discount':       'Numbers.json', // fallback until file generated
  'problems-numbers':       'Problems_on_Numbers.json',
};

// In-memory cache so files are only read once per run
const _cache = {};

/**
 * Load questions for a topic from the outputs folder.
 * Normalises to a consistent shape the test engine expects.
 */
function loadQuestions(topicId) {
  if (_cache[topicId]) return _cache[topicId];

  const filename = TOPIC_FILE_MAP[topicId];
  if (!filename) return [];

  const filePath = path.join(QUESTIONS_DIR, filename);
  if (!fs.existsSync(filePath)) return [];

  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    // Normalise format: the files use correct_answer (string), we need answer (index)
    const normalised = raw.map((q, i) => {
      const answerIndex = (q.options || []).indexOf(q.correct_answer);
      return {
        id: `${topicId}-${i}`,
        topic: q.topic || topicId,
        question: q.question,
        options: q.options,
        answer: answerIndex >= 0 ? answerIndex : 0,
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        exam_type: q.exam_type || 'mixed',
      };
    });
    _cache[topicId] = normalised;
    return normalised;
  } catch (err) {
    console.error(`[QuestionService] Failed to load ${filename}:`, err.message);
    return [];
  }
}

/**
 * Get all questions for a topic with optional filters.
 */
function getQuestions(topicId, { difficulty, exam_type } = {}) {
  let qs = loadQuestions(topicId);
  if (difficulty && difficulty !== 'mixed') {
    qs = qs.filter(q => q.difficulty === difficulty);
  }
  if (exam_type && exam_type !== 'all') {
    qs = qs.filter(q => q.exam_type === exam_type || q.exam_type === 'mixed');
  }
  return qs;
}

/**
 * Get a random subset of questions.
 * Fisher-Yates shuffle, then slice.
 */
function getRandomQuestions(topicId, count = 10, { difficulty, exam_type } = {}) {
  let pool = getQuestions(topicId, { difficulty, exam_type });

  // If filtered pool too small, fall back to all questions for topic
  if (pool.length < count) {
    pool = loadQuestions(topicId);
  }

  // Shuffle
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.slice(0, Math.min(count, arr.length));
}

/**
 * Get total question count available for a topic.
 */
function getQuestionCount(topicId) {
  return loadQuestions(topicId).length;
}

/**
 * List all available topic IDs that have question files.
 */
function getAvailableTopicIds() {
  return Object.keys(TOPIC_FILE_MAP).filter(id => {
    const filename = TOPIC_FILE_MAP[id];
    return fs.existsSync(path.join(QUESTIONS_DIR, filename));
  });
}

/**
 * Full Mock Test — pull `count` questions spread across ALL available topics.
 * Questions are shuffled so topics are interleaved randomly.
 */
function getMockQuestions(count = 50, { difficulty } = {}) {
  const topicIds = getAvailableTopicIds();
  if (!topicIds.length) return [];

  // How many questions per topic (at least 1, distribute evenly)
  const perTopic = Math.max(1, Math.ceil(count / topicIds.length));

  let pool = [];
  for (const topicId of topicIds) {
    let qs = loadQuestions(topicId);
    if (difficulty && difficulty !== 'mixed') {
      qs = qs.filter(q => q.difficulty === difficulty);
    }
    // Shuffle within topic
    const arr = [...qs];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    pool.push(...arr.slice(0, perTopic));
  }

  // Global shuffle so topics are interleaved
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}

module.exports = { getQuestions, getRandomQuestions, getMockQuestions, getQuestionCount, getAvailableTopicIds };
