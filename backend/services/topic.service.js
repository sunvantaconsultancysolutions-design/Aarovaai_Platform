const path = require('path');
const fs = require('fs');
const { readJSON, writeJSON, readNestedJSON } = require('../utils/fileStorage');

// Master topic catalog — all 32 arithmetic topics + other categories
const MASTER_TOPICS = [
  // ── ARITHMETIC ──
  { id: 'percentage', n: 'Percentage', e: '📊', bg: '#7c5cfc18', category: 'arithmetic', diff: 'easy', total: 100, desc: 'Discount, marked price, successive changes', col: 'var(--acc)', examTags: ['campus','govt','mba'] },
  { id: 'profit-loss', n: 'Profit & Loss', e: '💰', bg: '#130202', category: 'arithmetic', diff: 'medium', total: 100, desc: 'SP, CP, profit %, loss %, dishonest dealing', col: 'var(--rd)', examTags: ['campus','govt'] },
  { id: 'simple-interest', n: 'Simple Interest', e: '🏦', bg: '#020c1e', category: 'arithmetic', diff: 'easy', total: 100, desc: 'SI formula, principal, rate, time', col: 'var(--bl)', examTags: ['govt','mba'] },
  { id: 'compound-interest', n: 'Compound Interest', e: '📈', bg: '#011410', category: 'arithmetic', diff: 'medium', total: 100, desc: 'CI, half-yearly, quarterly, population', col: 'var(--tl)', examTags: ['govt','mba'] },
  { id: 'time-work', n: 'Time & Work', e: '⏱️', bg: '#031a09', category: 'arithmetic', diff: 'medium', total: 100, desc: 'Efficiency, pipes, MDH formula', col: 'var(--gr)', examTags: ['campus','govt'] },
  { id: 'time-distance', n: 'Time & Distance', e: '🚆', bg: '#130010', category: 'arithmetic', diff: 'medium', total: 100, desc: 'Speed, trains, boats & streams', col: 'var(--pk)', examTags: ['campus','govt'] },
  { id: 'ratio-proportion', n: 'Ratio & Proportion', e: '⚖️', bg: '#7c5cfc12', category: 'arithmetic', diff: 'easy', total: 100, desc: 'Duplicate ratio, third proportional, variation', col: 'var(--acc)', examTags: ['campus','govt','mba'] },
  { id: 'average', n: 'Average', e: '📉', bg: '#031a09', category: 'arithmetic', diff: 'easy', total: 100, desc: 'Weighted average, age problems, batting avg', col: 'var(--gr)', examTags: ['campus','govt'] },
  { id: 'probability', n: 'Probability', e: '🎲', bg: '#020c1e', category: 'arithmetic', diff: 'hard', total: 100, desc: 'Cards, dice, balls, conditional probability', col: 'var(--bl)', examTags: ['campus','mba'] },
  { id: 'permutation-combination', n: 'Permutation & Combination', e: '🔢', bg: '#120d00', category: 'arithmetic', diff: 'hard', total: 100, desc: 'nPr, nCr, arrangement, selection', col: 'var(--am)', examTags: ['campus','mba'] },
  { id: 'hcf-lcm', n: 'HCF & LCM', e: '🧮', bg: '#7c5cfc12', category: 'arithmetic', diff: 'easy', total: 100, desc: 'Factor method, Euclidean algorithm, problems', col: 'var(--acc)', examTags: ['campus','govt'] },
  { id: 'number-system', n: 'Number System', e: '🔣', bg: '#130202', category: 'arithmetic', diff: 'medium', total: 100, desc: 'Divisibility, remainders, BODMAS', col: 'var(--rd)', examTags: ['campus','govt'] },
  { id: 'problems-trains', n: 'Problems on Trains', e: '🚂', bg: '#130010', category: 'arithmetic', diff: 'easy', total: 100, desc: 'Crossing poles, platforms, two trains', col: 'var(--pk)', examTags: ['govt'] },
  { id: 'boats-streams', n: 'Boats & Streams', e: '⛵', bg: '#011410', category: 'arithmetic', diff: 'medium', total: 100, desc: 'Upstream, downstream, still water speed', col: 'var(--tl)', examTags: ['govt'] },
  { id: 'pipes-cistern', n: 'Pipes & Cistern', e: '🚿', bg: '#020c1e', category: 'arithmetic', diff: 'medium', total: 100, desc: 'Filling, emptying, leakage problems', col: 'var(--bl)', examTags: ['govt'] },
  { id: 'ages', n: 'Ages', e: '👥', bg: '#031a09', category: 'arithmetic', diff: 'easy', total: 100, desc: 'Present, past, future age problems', col: 'var(--gr)', examTags: ['campus','govt'] },
  { id: 'alligation-mixture', n: 'Alligation & Mixture', e: '🧪', bg: '#120d00', category: 'arithmetic', diff: 'hard', total: 100, desc: 'Rule of alligation, mean price, mixing ratios', col: 'var(--am)', examTags: ['govt','mba'] },
  { id: 'partnership', n: 'Partnership', e: '🤝', bg: '#7c5cfc12', category: 'arithmetic', diff: 'medium', total: 100, desc: 'Simple and compound partnership, profit share', col: 'var(--acc)', examTags: ['campus','govt'] },
  { id: 'calendar', n: 'Calendar', e: '📅', bg: '#130202', category: 'arithmetic', diff: 'easy', total: 100, desc: 'Day of the week, odd days, leap year', col: 'var(--rd)', examTags: ['campus','govt'] },
  { id: 'clock', n: 'Clock', e: '🕐', bg: '#130010', category: 'arithmetic', diff: 'medium', total: 100, desc: 'Angle between hands, gain/loss of time', col: 'var(--pk)', examTags: ['campus','govt'] },
  { id: 'area', n: 'Area', e: '📐', bg: '#011410', category: 'arithmetic', diff: 'medium', total: 100, desc: 'Rectangle, triangle, circle, polygon areas', col: 'var(--tl)', examTags: ['govt'] },
  { id: 'volume-surface', n: 'Volume & Surface Area', e: '📦', bg: '#020c1e', category: 'arithmetic', diff: 'hard', total: 100, desc: 'Cube, cuboid, cylinder, cone, sphere', col: 'var(--bl)', examTags: ['govt'] },
  { id: 'height-distance', n: 'Height & Distance', e: '🏔️', bg: '#031a09', category: 'arithmetic', diff: 'hard', total: 100, desc: 'Trigonometry angles, angle of elevation', col: 'var(--gr)', examTags: ['govt'] },
  { id: 'simplification', n: 'Simplification', e: '🔤', bg: '#120d00', category: 'arithmetic', diff: 'easy', total: 100, desc: 'VBODMAS, approximation, surds basics', col: 'var(--am)', examTags: ['campus','govt'] },
  { id: 'square-cube-roots', n: 'Square Roots & Cube Roots', e: '√', bg: '#7c5cfc12', category: 'arithmetic', diff: 'easy', total: 100, desc: 'Perfect squares, cube roots, estimation', col: 'var(--acc)', examTags: ['govt'] },
  { id: 'surds-indices', n: 'Surds & Indices', e: 'xⁿ', bg: '#130202', category: 'arithmetic', diff: 'hard', total: 100, desc: 'Laws of indices, surd simplification', col: 'var(--rd)', examTags: ['mba'] },
  { id: 'logarithm', n: 'Logarithm', e: '㏒', bg: '#130010', category: 'arithmetic', diff: 'hard', total: 100, desc: 'Log laws, change of base, log equations', col: 'var(--pk)', examTags: ['mba'] },
  { id: 'chain-rule', n: 'Chain Rule', e: '🔗', bg: '#011410', category: 'arithmetic', diff: 'medium', total: 100, desc: 'Direct & inverse proportion, work output', col: 'var(--tl)', examTags: ['campus','govt'] },
  { id: 'races-games', n: 'Races & Games', e: '🏁', bg: '#020c1e', category: 'arithmetic', diff: 'medium', total: 100, desc: 'Head start, games of 100, race problems', col: 'var(--bl)', examTags: ['campus'] },
  { id: 'stocks-shares', n: 'Stocks & Shares', e: '💹', bg: '#031a09', category: 'arithmetic', diff: 'hard', total: 100, desc: 'Brokerage, dividend, debentures, yield', col: 'var(--gr)', examTags: ['mba'] },
  { id: 'decimal-fractions', n: 'Decimal Fractions', e: '0.x', bg: '#120d00', category: 'arithmetic', diff: 'easy', total: 100, desc: 'Operations on decimals, recurring decimals', col: 'var(--am)', examTags: ['campus','govt'] },
  { id: 'bankers-discount', n: "Bankers Discount", e: '🏛️', bg: '#7c5cfc12', category: 'arithmetic', diff: 'hard', total: 100, desc: 'BD, TD, BG, true discount problems', col: 'var(--acc)', examTags: ['govt'] },
  // ── DATA INTERPRETATION ──
  { id: 'bar-charts', n: 'Bar Charts', e: '📊', bg: '#020c1e', category: 'data-interpretation', diff: 'medium', total: 50, desc: 'Reading and interpreting bar graphs', col: 'var(--bl)', examTags: ['campus','govt'] },
  { id: 'pie-charts', n: 'Pie Charts', e: '🥧', bg: '#130010', category: 'data-interpretation', diff: 'medium', total: 50, desc: 'Sector analysis and percentage calculations', col: 'var(--pk)', examTags: ['campus','govt'] },
  { id: 'line-graphs', n: 'Line Graphs', e: '📈', bg: '#031a09', category: 'data-interpretation', diff: 'easy', total: 50, desc: 'Trend analysis and comparison', col: 'var(--gr)', examTags: ['campus','govt'] },
  { id: 'tables', n: 'Tables', e: '📋', bg: '#120d00', category: 'data-interpretation', diff: 'easy', total: 50, desc: 'Tabular data reading and computation', col: 'var(--am)', examTags: ['campus','govt','mba'] },
  { id: 'mixed-graphs', n: 'Mixed Graphs', e: '🗃️', bg: '#7c5cfc12', category: 'data-interpretation', diff: 'hard', total: 50, desc: 'Combined DI with multiple chart types', col: 'var(--acc)', examTags: ['mba'] },
  { id: 'caselet', n: 'Caselet DI', e: '📝', bg: '#130202', category: 'data-interpretation', diff: 'hard', total: 50, desc: 'Data given in paragraph/text form', col: 'var(--rd)', examTags: ['mba'] },
  // ── LOGICAL REASONING ──
  { id: 'series-sequences', n: 'Number Series', e: '🔢', bg: '#7c5cfc12', category: 'logical-reasoning', diff: 'medium', total: 60, desc: 'Missing number, pattern recognition', col: 'var(--acc)', examTags: ['campus','govt'] },
  { id: 'coding-decoding', n: 'Coding & Decoding', e: '🔐', bg: '#020c1e', category: 'logical-reasoning', diff: 'medium', total: 60, desc: 'Letter/number based coding patterns', col: 'var(--bl)', examTags: ['campus','govt'] },
  { id: 'blood-relations', n: 'Blood Relations', e: '👨‍👩‍👧', bg: '#031a09', category: 'logical-reasoning', diff: 'medium', total: 60, desc: 'Family tree and relation problems', col: 'var(--gr)', examTags: ['campus','govt'] },
  { id: 'seating-arrangement', n: 'Seating Arrangement', e: '🪑', bg: '#130010', category: 'logical-reasoning', diff: 'hard', total: 60, desc: 'Linear and circular arrangement', col: 'var(--pk)', examTags: ['govt'] },
  { id: 'direction-sense', n: 'Direction & Distance', e: '🧭', bg: '#120d00', category: 'logical-reasoning', diff: 'easy', total: 60, desc: 'Navigation and distance problems', col: 'var(--am)', examTags: ['campus','govt'] },
  { id: 'syllogism', n: 'Syllogism', e: '💡', bg: '#011410', category: 'logical-reasoning', diff: 'medium', total: 60, desc: 'Statement and conclusion logic', col: 'var(--tl)', examTags: ['govt'] },
  { id: 'puzzles', n: 'Puzzles', e: '🧩', bg: '#130202', category: 'logical-reasoning', diff: 'hard', total: 60, desc: 'Scheduling, floor puzzles, ordering', col: 'var(--rd)', examTags: ['campus','govt'] },
  { id: 'inequalities', n: 'Inequalities', e: '≠', bg: '#7c5cfc12', category: 'logical-reasoning', diff: 'easy', total: 60, desc: 'Mathematical inequality based reasoning', col: 'var(--acc)', examTags: ['govt'] },
  { id: 'input-output', n: 'Input Output', e: '⚙️', bg: '#020c1e', category: 'logical-reasoning', diff: 'medium', total: 60, desc: 'Word/number rearrangement patterns', col: 'var(--bl)', examTags: ['govt'] },
  { id: 'logical-venn', n: 'Venn Diagrams', e: '🔵', bg: '#031a09', category: 'logical-reasoning', diff: 'easy', total: 60, desc: 'Set theory and Euler diagrams', col: 'var(--gr)', examTags: ['campus','govt'] },
  // ── VERBAL ABILITY ──
  { id: 'reading-comprehension', n: 'Reading Comprehension', e: '📖', bg: '#130010', category: 'verbal', diff: 'medium', total: 80, desc: 'Passage based questions', col: 'var(--pk)', examTags: ['campus','govt','mba'] },
  { id: 'vocabulary', n: 'Vocabulary', e: '📚', bg: '#120d00', category: 'verbal', diff: 'medium', total: 80, desc: 'Synonyms, antonyms, one-word substitution', col: 'var(--am)', examTags: ['campus','govt'] },
  { id: 'grammar', n: 'Grammar & Usage', e: '✍️', bg: '#7c5cfc12', category: 'verbal', diff: 'medium', total: 80, desc: 'Error spotting, sentence correction', col: 'var(--acc)', examTags: ['campus','govt'] },
  { id: 'para-jumbles', n: 'Para Jumbles', e: '🔀', bg: '#020c1e', category: 'verbal', diff: 'hard', total: 80, desc: 'Sentence rearrangement exercises', col: 'var(--bl)', examTags: ['mba'] },
  { id: 'fill-blanks', n: 'Fill in the Blanks', e: '___', bg: '#031a09', category: 'verbal', diff: 'easy', total: 80, desc: 'Context-based word selection', col: 'var(--gr)', examTags: ['campus','govt'] },
  { id: 'idioms-phrases', n: 'Idioms & Phrases', e: '💬', bg: '#130202', category: 'verbal', diff: 'medium', total: 80, desc: 'Common idioms and their meanings', col: 'var(--rd)', examTags: ['campus','govt'] },
  { id: 'sentence-completion', n: 'Sentence Completion', e: '✅', bg: '#011410', category: 'verbal', diff: 'easy', total: 80, desc: 'Cloze test and sentence completion', col: 'var(--tl)', examTags: ['campus'] },
  { id: 'critical-reasoning', n: 'Critical Reasoning', e: '🤔', bg: '#130010', category: 'verbal', diff: 'hard', total: 80, desc: 'Assumptions, inferences, arguments', col: 'var(--pk)', examTags: ['mba'] },
];

function getProgressForUser(userId) {
  const allProgress = readJSON('progress.json', {});
  return allProgress[userId] || { topics: {}, dailyActivity: {}, totalTime: 0, bookmarks: [] };
}

function getAllTopics(userId, { category, examType, status, difficulty, search } = {}) {
  let topics = [...MASTER_TOPICS];
  const userProgress = userId ? getProgressForUser(userId) : { topics: {} };

  // Apply filters
  if (category) topics = topics.filter(t => t.category === category);
  if (examType && examType !== 'all') topics = topics.filter(t => t.examTags?.includes(examType));
  if (difficulty) topics = topics.filter(t => t.diff === difficulty);
  if (search) {
    const q = search.toLowerCase();
    topics = topics.filter(t => t.n.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q));
  }

  return topics.map(t => {
    const prog = userProgress.topics[t.id] || { done: 0, accuracy: 0, timeSpent: 0 };
    const status_val = prog.done >= t.total ? 'done' : prog.done > 0 ? 'prog' : 'new';
    const bookmarked = (userProgress.bookmarks || []).includes(t.id);

    return {
      ...t,
      done: prog.done,
      accuracy: prog.accuracy || 0,
      timeSpent: prog.timeSpent || 0,
      status: status_val,
      bookmarked
    };
  }).filter(t => !status || t.status === status || status === 'all');
}

function getTopic(topicId, userId) {
  const topic = MASTER_TOPICS.find(t => t.id === topicId);
  if (!topic) return null;
  const userProgress = userId ? getProgressForUser(userId) : { topics: {} };
  const prog = userProgress.topics[topicId] || { done: 0, accuracy: 0, timeSpent: 0 };
  const status = prog.done >= topic.total ? 'done' : prog.done > 0 ? 'prog' : 'new';
  return { ...topic, done: prog.done, accuracy: prog.accuracy || 0, status };
}

function toggleBookmark(userId, topicId) {
  const allProgress = readJSON('progress.json', {});
  if (!allProgress[userId]) allProgress[userId] = { topics: {}, dailyActivity: {}, totalTime: 0, bookmarks: [] };
  const bookmarks = allProgress[userId].bookmarks || [];
  const idx = bookmarks.indexOf(topicId);
  if (idx === -1) bookmarks.push(topicId);
  else bookmarks.splice(idx, 1);
  allProgress[userId].bookmarks = bookmarks;
  writeJSON('progress.json', allProgress);
  return { bookmarked: idx === -1 };
}

function getCategoryCounts() {
  return {
    arithmetic: MASTER_TOPICS.filter(t => t.category === 'arithmetic').length,
    'data-interpretation': MASTER_TOPICS.filter(t => t.category === 'data-interpretation').length,
    'logical-reasoning': MASTER_TOPICS.filter(t => t.category === 'logical-reasoning').length,
    verbal: MASTER_TOPICS.filter(t => t.category === 'verbal').length,
    nonverbal: 0
  };
}

module.exports = { getAllTopics, getTopic, toggleBookmark, getCategoryCounts, MASTER_TOPICS };
