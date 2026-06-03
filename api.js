/**
 * AarovaaiAI — Shared API Helper
 * Include this script in every HTML page.
 * Handles: auth check, token refresh, fetch wrapper
 */

// Auto-detects the backend URL: uses current domain on Railway, falls back to localhost for local dev
const AAROVAAI_API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api'
  : window.location.origin + '/api';


// ── AUTH GUARD ──────────────────────────────────────────────────────────────
// Call at the top of each page to ensure user is logged in.
// Returns the current user object.
async function requireAuth() {
  const token = localStorage.getItem('aarovaai_token');
  if (!token) {
    _logout();
    return null;
  }

  try {
    const res = await fetch(AAROVAAI_API + '/auth/me', {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      // ✅ Valid token
      const data = await res.json();
      if (data.user) {
        localStorage.setItem('aarovaai_user', JSON.stringify(data.user));
        return data.user;
      }
    } else if (res.status === 401) {
      // ⏰ Token expired — try refresh
      const newToken = await _refreshToken();
      if (newToken) {
        // Retry with new token
        const res2 = await fetch(AAROVAAI_API + '/auth/me', {
          headers: { 'Authorization': 'Bearer ' + newToken }
        });
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2.user) {
            localStorage.setItem('aarovaai_user', JSON.stringify(data2.user));
            return data2.user;
          }
        }
      }
      // Refresh failed → logout
      _logout();
      return null;
    } else {
      // 403 or any other error = invalid/stale token → clear & redirect
      _logout();
      return null;
    }
  } catch (networkErr) {
    // 🌐 Network error (server down) — allow offline with cached user
    const cached = localStorage.getItem('aarovaai_user');
    if (cached) {
      console.warn('[AarovaaiAI] Offline mode — using cached user');
      return JSON.parse(cached);
    }
    _logout();
    return null;
  }
}

// ── FETCH WRAPPER ───────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('aarovaai_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  let res = await fetch(AAROVAAI_API + path, { ...options, headers });

  // Auto-refresh on 401 TOKEN_EXPIRED
  if (res.status === 401) {
    const json = await res.clone().json().catch(() => ({}));
    if (json.code === 'TOKEN_EXPIRED') {
      const refreshed = await _refreshToken();
      if (refreshed) {
        headers['Authorization'] = 'Bearer ' + refreshed;
        res = await fetch(AAROVAAI_API + path, { ...options, headers });
      } else {
        _logout();
        return {};
      }
    } else {
      _logout();
      return {};
    }
  }

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'API error');
  }

  return res.json();
}

async function _refreshToken() {
  const refresh = localStorage.getItem('aarovaai_refresh');
  if (!refresh) return null;
  try {
    const res = await fetch(AAROVAAI_API + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh })
    });
    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem('aarovaai_token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('aarovaai_refresh', data.refreshToken);
      return data.accessToken;
    }
  } catch (_) {}
  return null;
}

function _logout() {
  localStorage.removeItem('aarovaai_token');
  localStorage.removeItem('aarovaai_refresh');
  localStorage.removeItem('aarovaai_user');
  window.location.href = 'login.html';
}

// ── CURRENT USER ─────────────────────────────────────────────────────────────
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('aarovaai_user') || 'null');
}

// ── LOGOUT ───────────────────────────────────────────────────────────────────
async function aarovaaiLogout() {
  try {
    const refresh = localStorage.getItem('aarovaai_refresh');
    await apiFetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refresh })
    });
  } catch (_) {}
  _logout();
}

// ── CONVENIENCE METHODS ───────────────────────────────────────────────────────

// Topics
async function apiGetTopics(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return apiFetch('/topics' + (qs ? '?' + qs : ''));
}

// Random questions for a topic
async function apiGetQuestions(topicId, count = 10, { difficulty, exam_type } = {}) {
  const qs = new URLSearchParams({ count, ...(difficulty ? { difficulty } : {}), ...(exam_type ? { exam_type } : {}) }).toString();
  return apiFetch(`/questions/${topicId}/random?${qs}`);
}

// Full Mock Test — mixed questions from ALL topics
async function apiGetMockQuestions(count = 50, { difficulty } = {}) {
  const qs = new URLSearchParams({ count, ...(difficulty ? { difficulty } : {}) }).toString();
  return apiFetch(`/questions/mock/random?${qs}`);
}

// Submit test
async function apiSubmitTest(topicId, topicName, questions, answers, timeTaken, mode = 'test') {
  return apiFetch('/test/submit', {
    method: 'POST',
    body: JSON.stringify({ topicId, topicName, questions, answers, timeTaken, mode })
  });
}

// Dashboard
async function apiGetDashboard() {
  return apiFetch('/dashboard');
}

// Progress
async function apiGetProgress() {
  return apiFetch('/progress/summary');
}

// Activity
async function apiGetActivity(limit = 5, category = '') {
  const qs = new URLSearchParams({ limit, ...(category ? { category } : {}) }).toString();
  return apiFetch('/activity?' + qs);
}

// Leaderboard
async function apiGetLeaderboard(period = 'week', limit = 5, category = '') {
  const qs = new URLSearchParams({ period, limit, ...(category ? { category } : {}) }).toString();
  return apiFetch(`/leaderboard?${qs}`);
}

// Heatmap
async function apiGetHeatmap() {
  return apiFetch('/progress/heatmap');
}

// Accuracy trend
async function apiGetAccuracyTrend(period = '30d') {
  return apiFetch('/progress/accuracy-trend?period=' + period);
}

// Progress topics
async function apiGetProgressTopics() {
  return apiFetch('/progress/topics');
}

// Weak/Strong areas
async function apiGetAreas() {
  return apiFetch('/progress/areas');
}

// Difficulty stats
async function apiGetDifficulty() {
  return apiFetch('/progress/difficulty');
}

// Streak
async function apiGetStreak() {
  return apiFetch('/progress/streak');
}

// Rings (accuracy, covered, goal)
async function apiGetRings() {
  return apiFetch('/progress/rings');
}

// Badges
async function apiGetBadges() {
  return apiFetch('/badges');
}

// Test history
async function apiGetTestHistory(limit = 10, period) {
  const qs = new URLSearchParams({ limit, ...(period ? { period } : {}) }).toString();
  return apiFetch('/test/history?' + qs);
}

// Bookmark topic
async function apiBookmark(topicId) {
  return apiFetch(`/topics/${topicId}/bookmark`, { method: 'POST' });
}

// ── TOAST UTILITY ────────────────────────────────────────────────────────────
function showAarovaaiToast(msg, type = '') {
  let t = document.getElementById('aarovaai-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'aarovaai-toast';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:#1c1c28;border:1px solid #333348;border-radius:12px;padding:12px 20px;font-size:13px;font-weight:600;color:#eeeeff;opacity:0;transition:.3s;pointer-events:none;font-family:Sora,sans-serif;max-width:300px';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  if (type === 'ok') { t.style.borderColor = '#154828'; t.style.background = '#031a09'; t.style.color = '#22c55e'; }
  else if (type === 'err') { t.style.borderColor = '#4a1010'; t.style.background = '#130202'; t.style.color = '#ef4444'; }
  else { t.style.borderColor = '#333348'; t.style.background = '#1c1c28'; t.style.color = '#eeeeff'; }
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}

// ── DATE HELPER ───────────────────────────────────────────────────────────────
function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return diffDays + ' days ago';
}
