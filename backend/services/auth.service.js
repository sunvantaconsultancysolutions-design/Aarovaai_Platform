const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../utils/fileStorage');

const USERS_FILE = 'users.json';

function getUsers() { return readJSON(USERS_FILE, []); }
function saveUsers(users) { writeJSON(USERS_FILE, users); }

function generateTokens(user) {
  const payload = { id: user.id, email: user.email, name: user.name };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  return { accessToken, refreshToken };
}

async function register({ name, email, phone, password }) {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw Object.assign(new Error('Email already registered'), { status: 409 });
  }
  const hashed = await bcrypt.hash(password, 12);
  const user = {
    id: uuidv4(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone || '',
    password: hashed,
    profileImage: null,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    refreshTokens: []
  };
  users.push(user);
  saveUsers(users);

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshTokens = [refreshToken];
  saveUsers(users);

  return { accessToken, refreshToken, user: sanitize(user) };
}

async function login({ email, password }) {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Invalid email or password'), { status: 401 });

  user.lastLogin = new Date().toISOString();
  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken]; // keep last 5
  saveUsers(users);

  return { accessToken, refreshToken, user: sanitize(user) };
}

function refresh(token) {
  if (!token) throw Object.assign(new Error('Refresh token required'), { status: 401 });
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 403 });
  }

  const users = getUsers();
  const user = users.find(u => u.id === decoded.id);
  if (!user || !(user.refreshTokens || []).includes(token)) {
    throw Object.assign(new Error('Refresh token revoked'), { status: 403 });
  }

  const { accessToken, refreshToken: newRefresh } = generateTokens(user);
  user.refreshTokens = user.refreshTokens.filter(t => t !== token);
  user.refreshTokens.push(newRefresh);
  saveUsers(users);

  return { accessToken, refreshToken: newRefresh };
}

function logout(userId, token) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (user && token) {
    user.refreshTokens = (user.refreshTokens || []).filter(t => t !== token);
    saveUsers(users);
  }
}

function getById(id) {
  const users = getUsers();
  const user = users.find(u => u.id === id);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return sanitize(user);
}

function sanitize(user) {
  const { password, refreshTokens, ...safe } = user;
  return safe;
}

module.exports = { register, login, refresh, logout, getById };
