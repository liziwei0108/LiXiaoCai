import bcrypt from 'bcrypt';
import pool from '../config/db.js';

const SALT_ROUNDS = 10;

// 根据邮箱查找用户
export async function findUserByEmail(email) {
  try {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('查找用户失败:', error);
    throw error;
  }
}

// 根据 ID 查找用户
export async function findUserById(userId) {
  try {
    const query = 'SELECT id, email, nickname, avatar, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('查找用户失败:', error);
    throw error;
  }
}

// 创建新用户
export async function createUser(email, password, nickname = '用户') {
  try {
    // 检查邮箱是否已存在
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error('邮箱已被注册');
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 创建用户
    const query = `
      INSERT INTO users (email, password_hash, nickname)
      VALUES ($1, $2, $3)
      RETURNING id, email, nickname, avatar, created_at
    `;
    const result = await pool.query(query, [email, passwordHash, nickname]);
    
    console.log('新用户创建成功:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
}

// 验证用户密码
export async function validatePassword(password, passwordHash) {
  return await bcrypt.compare(password, passwordHash);
}

// 更新用户信息
export async function updateUser(userId, updates) {
  try {
    const allowedFields = ['nickname', 'avatar'];
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      throw new Error('没有可更新的字段');
    }

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING id, email, nickname, avatar, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('更新用户失败:', error);
    throw error;
  }
}

export default {
  findUserByEmail,
  findUserById,
  createUser,
  validatePassword,
  updateUser
};
