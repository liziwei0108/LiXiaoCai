import { streamChatResponse } from '../services/aiService.js';
import { saveMessage, getChatHistory } from '../services/dbService.js';

export async function handleChat(req, res) {
  console.log('----------接收请求，开始处理-----------');
  const { messages, id } = req.body;

  try {
    // 存储用户消息
    if (messages && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        await saveMessage(
          'testId',
          lastUserMessage.role,
          lastUserMessage.content || '',
          lastUserMessage.parts || [{ type: 'text', text: lastUserMessage.content || '' }]
        );
      }
    }

    // 处理 AI 响应并存储
    await streamChatResponse(messages, id, res);
    console.log('----------响应已通过 pipe 发送----------');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '调用 AI 失败' });
  }
}

export async function handleGetHistory(req, res) {
  console.log('----------获取聊天历史-----------');
  
  try {
    const messages = await getChatHistory('testId');
    
    // 转换消息格式以符合前端需求
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      parts: msg.parts,
      createdAt: msg.created_at
    }));
    
    res.status(200).json(formattedMessages);
    console.log('----------聊天历史获取成功----------');
  } catch (error) {
    console.error('获取聊天历史失败:', error);
    res.status(500).json({ error: '获取聊天历史失败' });
  }
}
