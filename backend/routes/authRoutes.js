import express from 'express';
import rateLimit from 'express-rate-limit';
import { handleRegister, handleLogin, handleGetMe, handleLogout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 登录频率限制：5 分钟内最多 5 次尝试
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 分钟
  max: 5, // 最多 5 次
  message: { error: '登录尝试次数过多，请 5 分钟后重试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 注册频率限制：1 小时内最多 3 次
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 3, // 最多 3 次
  message: { error: '注册次数过多，请 1 小时后重试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 公开路由
router.post('/register', registerLimiter, handleRegister);
router.post('/login', loginLimiter, handleLogin);

// 需要认证的路由
router.get('/me', authenticateToken, handleGetMe);
router.post('/logout', authenticateToken, handleLogout);

export default router;
