import express from 'express';
import jwt from 'jsonwebtoken';
import { 
  handleChat, 
  handleGetHistory, 
  handleGetConversations, 
  handleCreateConversation, 
  handleDeleteConversation 
} from '../controllers/chatController.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 可选认证中间件 - 支持游客模式
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // 没有 token，作为游客继续
    return next();
  }

  // 验证 token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
}

router.post('/chat', optionalAuth, handleChat);
router.get('/history', optionalAuth, handleGetHistory);
router.get('/conversations', optionalAuth, handleGetConversations);
router.post('/conversations', optionalAuth, handleCreateConversation);
router.delete('/conversations/:conversationId', optionalAuth, handleDeleteConversation);

export default router;
