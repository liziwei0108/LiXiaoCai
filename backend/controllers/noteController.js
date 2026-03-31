import { getAllNotes, getNoteById, deleteNoteById, createNote, generateNoteId } from '../services/noteService.js';
import OpenAI from 'openai';
import config from '../config/index.js';

const client = new OpenAI({
  baseURL: config.ai.baseURL,
  apiKey: config.ai.apiKey,
});

// 生成向量嵌入
async function generateEmbedding(text) {
  const response = await client.embeddings.create({
    model: config.ai.embeddingModel,
    input: text,
  });
  return response.data[0].embedding;
}

// 获取笔记列表
export async function handleGetNotes(req, res) {
  console.log('----------获取笔记列表-----------');

  try {
    // 从认证中间件获取用户ID（JWT token 中存储的是 userId）
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: '未登录' });
    }

    const notes = await getAllNotes(userId);
    console.log(`获取到用户 ${userId} 的 ${notes.length} 条笔记`);

    res.status(200).json({
      success: true,
      notes: notes.map(note => ({
        id: note.id,
        noteDate: note.note_date,
        noteType: note.note_type,
        relatedSymbols: note.related_symbols,
        summary: note.summary,
        updatedAt: note.updated_at
      }))
    });
  } catch (error) {
    console.error('获取笔记列表失败:', error);
    res.status(500).json({ error: '获取笔记列表失败' });
  }
}

// 获取笔记详情
export async function handleGetNoteById(req, res) {
  console.log('----------获取笔记详情-----------');

  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '未登录' });
    }

    const note = await getNoteById(id, userId);

    if (!note) {
      return res.status(404).json({ error: '笔记不存在' });
    }

    console.log('获取笔记详情成功:', id);

    res.status(200).json({
      success: true,
      note: {
        id: note.id,
        noteDate: note.note_date,
        noteType: note.note_type,
        relatedSymbols: note.related_symbols,
        content: note.content,
        updatedAt: note.updated_at
      }
    });
  } catch (error) {
    console.error('获取笔记详情失败:', error);
    res.status(500).json({ error: '获取笔记详情失败' });
  }
}

// 删除笔记
export async function handleDeleteNote(req, res) {
  console.log('----------删除笔记-----------');

  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '未登录' });
    }

    const result = await deleteNoteById(id, userId);

    if (!result) {
      return res.status(404).json({ error: '笔记不存在' });
    }

    console.log('笔记删除成功:', id);

    res.status(200).json({
      success: true,
      message: '笔记已删除'
    });
  } catch (error) {
    console.error('删除笔记失败:', error);
    res.status(500).json({ error: '删除笔记失败' });
  }
}

// 上传笔记
export async function handleUploadNote(req, res) {
  console.log('----------上传笔记-----------');

  try {
    const { content, filename } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: '未登录' });
    }

    if (!content || !filename) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 解析笔记元数据
    let noteType = null;
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('# ')) {
        noteType = trimmedLine.substring(2).trim();
        break;
      }
    }

    // 生成向量嵌入
    console.log('正在生成向量嵌入...');
    const embedding = await generateEmbedding(content);

    // 创建笔记
    const noteId = generateNoteId();
    const note = await createNote({
      id: noteId,
      userId: userId,
      noteDate: new Date().toISOString().split('T')[0],
      noteType: noteType || filename.replace(/\.(md|txt)$/i, ''),
      relatedSymbols: null,
      content,
      embedding
    });

    console.log('笔记上传成功:', note.id);

    res.status(201).json({
      success: true,
      message: '笔记上传成功',
      note: {
        id: note.id,
        noteDate: note.note_date,
        noteType: note.note_type,
        updatedAt: note.updated_at
      }
    });
  } catch (error) {
    console.error('上传笔记失败:', error);
    res.status(500).json({ error: '上传笔记失败' });
  }
}
