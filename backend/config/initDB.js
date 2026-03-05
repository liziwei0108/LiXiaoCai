import pool from './db.js';

// 初始化数据库表结构
export async function initDatabase() {
  try {
    // 创建聊天历史表
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- 创建索引以提高查询性能
      CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
      CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);
    `;
    
    await pool.query(createTableQuery);
    console.log('数据库表结构初始化成功！');
  } catch (error) {
    console.error('数据库表结构初始化失败:', error);
    throw error;
  }
}

export default initDatabase;