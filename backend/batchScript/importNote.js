import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import pool from '../config/db.js';
import config from '../config/index.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOTES_DIR = 'D:/学习笔记本/my_notes/投资学习笔记';

const openai = createOpenAI({
  baseURL: 'https://api-inference.modelscope.cn/v1',
  apiKey: process.env.DASHSCOPE_API_KEY,
});

async function generateEmbedding(text) {
  const { embedding } = await embed({
    model: openai.embedding(config.ai.embeddingModel),
    value: text,
  });
  return embedding;
}

async function insertNote(inode, noteDate, noteType, relatedSymbols, content, embedding) {
  const query = `
    INSERT INTO notes (id, note_date, note_type, related_symbols, content, embedding)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE
    SET note_date = EXCLUDED.note_date,
        note_type = EXCLUDED.note_type,
        related_symbols = EXCLUDED.related_symbols,
        content = EXCLUDED.content,
        embedding = EXCLUDED.embedding
    RETURNING id
  `;

  const values = [
    String(inode),
    noteDate || null,
    noteType || null,
    relatedSymbols || null,
    content,
    JSON.stringify(embedding)
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0].id;
  } catch (error) {
    console.error('插入笔记失败:', error);
    throw error;
  }
}

async function processMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    const filename = path.basename(filePath, '.md');
    console.log(`\n处理文件: ${filename}`);

    let noteDate = null;
    let noteType = null;
    let relatedSymbols = null;

    const fileStats = fs.statSync(filePath);
    const inode = fileStats.ino;
    noteDate = fileStats.mtime.toISOString().split('T')[0];

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('# ')) {
        noteType = trimmedLine.substring(2).trim();
        break;
      }
    }

    const embedding = await generateEmbedding(content);
    const id = await insertNote(inode, noteDate, noteType, relatedSymbols, content, embedding);

    console.log(`✓ 笔记已处理: ID=${id}, inode=${inode}, 文件=${filename}, 日期=${noteDate}`);
    return true;
  } catch (error) {
    console.error(`✗ 处理文件失败 ${filePath}:`, error.message);
    return false;
  }
}

async function importNotes() {
  console.log('开始导入笔记...');

  try {
    const files = fs.readdirSync(NOTES_DIR)
      .filter(file => file.endsWith('.md'))
      .map(file => path.join(NOTES_DIR, file));

    console.log(`找到 ${files.length} 个Markdown文件`);

    let successCount = 0;
    let failCount = 0;

    for (const filePath of files) {
      const result = await processMarkdownFile(filePath);
      if (result) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log('\n====================');
    console.log(`导入完成: 成功 ${successCount} 个, 失败 ${failCount} 个`);
    console.log('====================');

  } catch (error) {
    console.error('导入过程出错:', error);
  } finally {
    await pool.end();
  }
}

importNotes();
