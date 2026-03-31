import pool from '../config/db.js';

// 获取当前用户的所有笔记列表（按 updated_at 降序）
export async function getAllNotes(userId) {
  const query = `
    SELECT id, note_date, note_type, related_symbols, content, updated_at
    FROM notes
    WHERE user_id = $1
    ORDER BY updated_at DESC
  `;

  try {
    const result = await pool.query(query, [userId]);
    // 在 JavaScript 中处理摘要，避免 PostgreSQL 的编码问题
    return result.rows.map(note => ({
      ...note,
      summary: note.content ? note.content.substring(0, 200) : ''
    }));
  } catch (error) {
    console.error('获取笔记列表失败:', error);
    throw error;
  }
}

// 根据ID获取笔记详情（只能获取自己的笔记）
export async function getNoteById(id, userId) {
  const query = `
    SELECT id, note_date, note_type, related_symbols, content, updated_at
    FROM notes
    WHERE id = $1 AND user_id = $2
  `;

  try {
    const result = await pool.query(query, [id, userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('获取笔记详情失败:', error);
    throw error;
  }
}

// 删除笔记（只能删除自己的笔记）
export async function deleteNoteById(id, userId) {
  const query = `
    DELETE FROM notes
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [id, userId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('删除笔记失败:', error);
    throw error;
  }
}

// 创建笔记
export async function createNote({ id, userId, noteDate, noteType, relatedSymbols, content, embedding }) {
  const query = `
    INSERT INTO notes (id, user_id, note_date, note_type, related_symbols, content, embedding, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        note_date = EXCLUDED.note_date,
        note_type = EXCLUDED.note_type,
        related_symbols = EXCLUDED.related_symbols,
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding,
        updated_at = CURRENT_TIMESTAMP
    RETURNING id, note_date, note_type, updated_at
  `;

  const values = [
    id,
    userId,
    noteDate || null,
    noteType || null,
    relatedSymbols || null,
    content,
    embedding ? JSON.stringify(embedding) : null
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('创建笔记失败:', error);
    throw error;
  }
}

// 生成唯一ID（基于时间戳和随机数）
export function generateNoteId() {
  return `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
