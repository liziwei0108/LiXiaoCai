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
    model: openai.responses(config.ai.model),
    messages: modelMessages,
    stopWhen: stepCountIs(10),
    tools: {
      searchNotes: tool({
        description: config.searchNotesPrompt,
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
      web_search: openai.tools.webSearch({
        searchContextSize: 'high',
        userLocation: {
          type: 'approximate',
          city: '上海',
          region: '中国',
        },
      }),
    },
    onStepFinish: (event) => {
      console.log('步骤完成:', event.stepNumber);
      console.log('工具调用结果:', JSON.stringify(event.content));
    },
    onFinish: async (event) => {
      console.log('当前回答完成');
      
      const assistantParts = [{ type: 'text', text: event.text }];
      
      try {
        await saveMessage(
          'testId',
          'assistant',
          event.text,
          assistantParts
        );
        
        await updateConversationTime('testId');
        
        console.log('AI 响应存储成功并更新会话时间');
      } catch (error) {
        console.error('存储 AI 响应失败:', error);
      }
    },
    onError: (error) => {
      console.error('流式响应错误:', error);
    }
  });

  return result.pipeUIMessageStreamToResponse(res)
}
