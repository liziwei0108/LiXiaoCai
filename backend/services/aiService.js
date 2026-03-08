import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import config from '../config/index.js';
import { saveMessage, updateConversationTime } from './dbService.js';

const openai = createOpenAI({
  baseURL: config.ai.baseURL,
  apiKey: config.ai.apiKey,
});

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
