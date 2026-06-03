const { asyncHandler } = require('../middleware/error.middleware');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const result = await authService.register({ name, email, phone, password });
  res.status(201).json({ success: true, message: 'Registration successful', ...result });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  res.json({ success: true, message: 'Login successful', ...result });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = authService.refresh(refreshToken);
  res.json({ success: true, ...tokens });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  authService.logout(req.user.id, refreshToken);
  res.json({ success: true, message: 'Logged out successfully' });
});

const me = asyncHandler(async (req, res) => {
  const user = authService.getById(req.user.id);
  res.json({ success: true, user });
});

module.exports = { register, login, refresh, logout, me };
