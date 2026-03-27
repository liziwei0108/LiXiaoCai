import pool from '../config/db.js';


// 存储消息到数据库
export async function saveMessage(conversationId, role, content, parts) {
  try {
    const query = `
      INSERT INTO messages (id, conversation_id, role, content, parts)
      VALUES ($1, $2, $3, $4, $5)
    `;
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
    const query = 'UPDATE conversations SET updated_at = NOW() WHERE id = $1';
    await pool.query(query, [conversationId]);
    console.log('会话更新时间成功:', conversationId);
  } catch (error) {
    console.error('更新会话时间失败:', error);
    throw error;
  }
}

// 检索知识库，返回纯文本供模型使用
export async function searchNotesFromDb(queryEmbedding, limit = 3) {
  try {
    console.log('开始检索笔记库');
    
    // 确保 embedding 是数组格式
    const embeddingArray = Array.isArray(queryEmbedding) 
      ? queryEmbedding 
      : (queryEmbedding && Array.isArray(queryEmbedding.embedding)) 
        ? queryEmbedding.embedding 
        : [];
    
    
    const query = `
      SELECT note_date, content
      FROM notes
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `;
    const res = await pool.query(query, [JSON.stringify(embeddingArray), limit]);
    console.log('检索笔记库完成，共找到', res.rows.length, '条笔记');
    if (res.rows.length === 0) return '暂无符合要求的笔记';
    return res.rows.map(row => 
      `[${row.note_date || '无日期'}] ${row.content}`
    ).join('\n');

  } catch (error) {
    console.error('检索知识库失败:', error);
    throw error;
  }
}

// 获取所有会话列表
export async function getAllConversations() {
  try {
    const query = `
      SELECT c.id, c.created_at, c.updated_at,
        (SELECT content FROM messages 
         WHERE conversation_id = c.id AND role = 'user' 
         ORDER BY created_at ASC LIMIT 1) as first_message
      FROM conversations c
      ORDER BY c.updated_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => ({
      id: row.id,
      title: row.first_message ? row.first_message.slice(0, 20) + (row.first_message.length > 20 ? '...' : '') : '新对话',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (error) {
    console.error('获取会话列表失败:', error);
    throw error;
  }
}

// 创建新会话
export async function createConversation() {
  try {
    const conversationId = `conv_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const query = 'INSERT INTO conversations (id) VALUES ($1) RETURNING id, created_at, updated_at';
    const result = await pool.query(query, [conversationId]);
    console.log('新会话创建成功:', conversationId);
    return {
      id: result.rows[0].id,
      title: '新对话',
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at
    };
  } catch (error) {
    console.error('创建会话失败:', error);
    throw error;
  }
}

// 删除会话
export async function deleteConversation(conversationId) {
  try {
    // 先删除关联的消息
    const deleteMessagesQuery = 'DELETE FROM messages WHERE conversation_id = $1';
    await pool.query(deleteMessagesQuery, [conversationId]);
    
    // 删除会话
    const deleteConvQuery = 'DELETE FROM conversations WHERE id = $1';
    await pool.query(deleteConvQuery, [conversationId]);
    console.log('会话删除成功:', conversationId);
  } catch (error) {
    console.error('删除会话失败:', error);
    throw error;
  }
}

export default {
  saveMessage,
  getChatHistory,
  updateConversationTime,
  getAllConversations,
  createConversation,
  deleteConversation
};