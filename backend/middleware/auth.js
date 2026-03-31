import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// JWT 认证中间件
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '未提供访问令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ error: '令牌已过期' });
      }
      return res.status(403).json({ error: '无效的令牌' });
    }
    
    req.user = user;
    next();
  });
}

// 生成 JWT 令牌
export function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      nickname: user.nickname 
    },
    JWT_SECRET,
    { expiresIn: '7d' } // 7 天过期
  );
}

export default { authenticateToken, generateToken };
