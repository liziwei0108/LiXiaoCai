import { streamText, convertToModelMessages } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import config from '../config/index.js';

const openai = createOpenAI({
  baseURL: config.ai.baseURL,
  apiKey: config.ai.apiKey,
});

export async function streamChatResponse(messages, res) {
  const modelMessages = await convertToModelMessages(messages);
  
  modelMessages.unshift({
    role: 'system',
    content: config.systemPrompt,
  });

  console.log('发送的messages', JSON.stringify(modelMessages));

  const result = streamText({
    model: openai.chat(config.ai.model),
    messages: modelMessages,
  });

  result.pipeUIMessageStreamToResponse(res);
}
