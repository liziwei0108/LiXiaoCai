import { streamChatResponse } from '../services/aiService.js';
import { saveMessage, getChatHistory, getAllConversations, createConversation, deleteConversation, updateConversationTime, verifyConversationOwnership } from '../services/dbService.js';

export async function handleChat(req, res) {
  console.log('----------接收请求，开始处理-----------');
  const { messages, conversationId } = req.body;
  const userId = req.user?.userId || null;

  try {
    if (!conversationId) {
      res.status(400).json({ error: 'conversationId 不能为空' });
      return;
    }

    // 验证会话所有权
    const hasOwnership = await verifyConversationOwnership(conversationId, userId);
    if (!hasOwnership) {
      return res.status(403).json({ error: '无权限访问该会话' });
    }

    if (messages && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        await saveMessage(
          conversationId,
          lastUserMessage.role,
          lastUserMessage.content || '',
          lastUserMessage.parts || [{ type: 'text', text: lastUserMessage.content || '' }]
        );
      }
    }

    await streamChatResponse(messages, conversationId, res);
    
    // 更新会话时间
    await updateConversationTime(conversationId);
    
    console.log('----------流式响应完成----------');
  } catch (error) {
    console.error(error);
    // 如果响应头还未发送，才返回 JSON 错误
    if (!res.headersSent) {
      res.status(500).json({ error: '调用 AI 失败' });
    }
  }
}

export async function handleGetHistory(req, res) {
  console.log('----------获取聊天历史-----------');
  const { conversationId } = req.query;
  const userId = req.user?.userId || null;
  
  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId 不能为空' });
  }
  
  try {
    // 验证会话所有权
    const hasOwnership = await verifyConversationOwnership(conversationId, userId);
    if (!hasOwnership) {
      return res.status(403).json({ error: '无权限访问该会话' });
    }

    const messages = await getChatHistory(conversationId);
    
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

export async function handleGetConversations(req, res) {
  console.log('----------获取会话列表-----------');
  const userId = req.user?.userId || null;
  
  try {
    const conversations = await getAllConversations(userId);
    res.status(200).json(conversations);
    console.log('----------会话列表获取成功----------');
  } catch (error) {
    console.error('获取会话列表失败:', error);
    res.status(500).json({ error: '获取会话列表失败' });
  }
}

export async function handleCreateConversation(req, res) {
  console.log('----------创建新会话-----------');
  const userId = req.user?.userId || null;
  
  try {
    const conversation = await createConversation(userId);
    res.status(201).json(conversation);
    console.log('----------新会话创建成功----------');
  } catch (error) {
    console.error('创建会话失败:', error);
    res.status(500).json({ error: '创建会话失败' });
  }
}

export async function handleDeleteConversation(req, res) {
  console.log('----------删除会话-----------');
  const { conversationId } = req.params;
  const userId = req.user?.userId || null;
  
  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId 不能为空' });
  }
  
  try {
    await deleteConversation(conversationId, userId);
    res.status(200).json({ message: '会话删除成功' });
    console.log('----------会话删除成功----------');
  } catch (error) {
    console.error('删除会话失败:', error);
    if (error.message === '会话不存在或无权限删除') {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: '删除会话失败' });
  }
}
