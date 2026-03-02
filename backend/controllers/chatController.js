import { streamChatResponse } from '../services/aiService.js';

export async function handleChat(req, res) {
  console.log('----------接收请求，开始处理-----------');
  const { messages } = req.body;

  try {
    await streamChatResponse(messages, res);
    console.log('----------响应已通过 pipe 发送----------');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '调用 AI 失败' });
  }
}
