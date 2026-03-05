import pool from '../config/db.js';

// 初始化 testId 会话
export async function initTestConversation() {
  try {
    // 检查 testId 会话是否存在
    const checkQuery = 'SELECT id FROM conversations WHERE id = $1';
    const checkResult = await pool.query(checkQuery, ['testId']);
    
    if (checkResult.rows.length === 0) {
      // 创建 testId 会话
      const createQuery = 'INSERT INTO conversations (id) VALUES ($1)';
      await pool.query(createQuery, ['testId']);
      console.log('testId 会话创建成功！');
    } else {
      console.log('testId 会话已存在，无需创建');
    }
  } catch (error) {
    console.error('初始化 testId 会话失败:', error);
    throw error;
  }
}

// 存储消息到数据库
export async function saveMessage(conversationId, role, content, parts) {
  try {
    const query = `
      INSERT INTO messages (id, conversation_id, role, content, parts)
      VALUES ($1, $2, $3, $4, $5)
    `;
    debugger
    // 生成唯一 ID
    const messageId = `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // 确保 parts 是有效的 JSON 字符串
    const partsJson = typeof parts === 'string' ? parts : JSON.stringify(parts);
    await pool.query(query, [messageId, conversationId, role, content, partsJson]);
    console.log('消息存储成功:', messageId);
    return messageId;
  } catch (error) {
    console.error('存储消息失败:', error);
    throw error;
  }
}

// 获取会话的聊天历史
export async function getChatHistory(conversationId) {
  try {
    const query = `
      SELECT id, role, content, parts, created_at
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `;
    
    const result = await pool.query(query, [conversationId]);
    return result.rows;
  } catch (error) {
    console.error('获取聊天历史失败:', error);
    throw error;
  }
}

// 更新会话的更新时间
export async function updateConversationTime(conversationId) {
  try {
    const query = 'UPDATE conversations SET update_time = NOW() WHERE id = $1';
    await pool.query(query, [conversationId]);
    console.log('会话更新时间成功:', conversationId);
  } catch (error) {
    console.error('更新会话时间失败:', error);
    throw error;
  }
}

export default {
  initTestConversation,
  saveMessage,
  getChatHistory,
  updateConversationTime
};