import { z } from 'zod';
import { findUserByEmail, findUserById, createUser, validatePassword } from '../services/authService.js';
import { generateToken } from '../middleware/auth.js';

// 注册验证 Schema
const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要 6 个字符'),
  nickname: z.string().min(1, '昵称不能为空').max(20, '昵称最多 20 个字符').optional()
});

// 登录验证 Schema
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码')
});

// 注册
export async function handleRegister(req, res) {
  console.log('----------用户注册-----------');
  
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, password, nickname } = validatedData;

    // 创建用户
    const user = await createUser(email, password, nickname || '用户');
    
    // 生成 JWT
    const token = generateToken(user);

    console.log('用户注册成功:', user.id);
    
    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('注册失败:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '输入验证失败',
        details: error.errors.map(e => e.message)
      });
    }
    
    if (error.message === '邮箱已被注册') {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
}

// 登录
export async function handleLogin(req, res) {
  console.log('----------用户登录-----------');
  
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // 查找用户
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    // 验证密码
    const isPasswordValid = await validatePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '密码错误' });
    }

    // 生成 JWT
    const token = generateToken(user);

    console.log('用户登录成功:', user.id);
    
    res.status(200).json({
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('登录失败:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '输入验证失败',
        details: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
}

// 获取当前用户信息
export async function handleGetMe(req, res) {
  console.log('----------获取当前用户信息-----------');
  
  try {
    const userId = req.user.userId;
    const user = await findUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
}

// 登出（前端只需删除 token，后端可选：加入黑名单）
export async function handleLogout(req, res) {
  console.log('----------用户登出-----------');
  
  // 由于使用 JWT，登出主要由前端处理（删除本地 token）
  // 后端可以在这里实现 token 黑名单机制
  
  res.status(200).json({ message: '登出成功' });
}

export default {
  handleRegister,
  handleLogin,
  handleGetMe,
  handleLogout
};
