import { streamText, convertToModelMessages, tool, embed, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import config from '../config/index.js';
import { saveMessage, updateConversationTime, searchNotesFromDb } from './dbService.js';

const openai = createOpenAI({
  baseURL: config.ai.baseURL,
  apiKey: config.ai.apiKey,
});

async function generateEmbedding(text) {
  const {embedding} = await embed({
    model: openai.embedding(config.ai.embeddingModel),
    value: text,
  });
  return embedding;
}

// 检索笔记中相关文档
async function searchNotes(query, limit = 5) {
  const embedding = await generateEmbedding(query);
  const res = await searchNotesFromDb(embedding, limit);
  return res
}

export async function streamChatResponse(messages, id, res) {
  if(!id) {
    console.error('id 不能为空');
    throw new Error('id 不能为空');
  }
  console.log('----获取会话id', id)
  const modelMessages = await convertToModelMessages(messages);
  
  modelMessages.unshift({
    role: 'system',
    content: config.systemPrompt,
  });

  console.log('发送的messages', JSON.stringify(modelMessages));

  const result = streamText({
    model: openai.chat(config.ai.model),
    messages: modelMessages,
    stopWhen: stepCountIs(5), // 允许最多5步，将工具生成结果返回给模型，确保工具结果能被再次使用
    tools: {
      // 定义一个名为 searchNotes 的工具，用于在用户查询相关问题时检索笔记中文档
      searchNotes: tool({
        description: config.searchNotesPrompt,
        // 定义工具的输入参数
        inputSchema: z.object({
          query: z
            .string()
            .describe('检索关键词，通常是用户的问题或关键实体'),
        }),
        execute: async ({ query }) => {
          console.log(`开始使用searchNotes工具，检索笔记关键词: ${query}`);
          const results = await searchNotes(query);
          return results;
        },
      }),
    },
    onFinish: async (event) => {
      // event.text 是完整回复文本
      // 注意：如果模型返回的是多 part（如工具调用），可能需要更复杂的处理
      const assistantParts = [{ type: 'text', text: event.text }];
      
      try {
        // 存储 AI 响应消息
        await saveMessage(
          'testId',
          'assistant',
          event.text,
          assistantParts
        );
        
        // 更新会话的更新时间
        await updateConversationTime('testId');
        
        console.log('AI 响应存储成功并更新会话时间');
      } catch (error) {
        console.error('存储 AI 响应失败:', error);
      }
    }
  });

  result.pipeUIMessageStreamToResponse(res)

  
}
