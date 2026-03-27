import express from 'express';
import { 
  handleChat, 
  handleGetHistory, 
  handleGetConversations, 
  handleCreateConversation, 
  handleDeleteConversation 
} from '../controllers/chatController.js';

const router = express.Router();

router.post('/chat', handleChat);
router.get('/history', handleGetHistory);
router.get('/conversations', handleGetConversations);
router.post('/conversations', handleCreateConversation);
router.delete('/conversations/:conversationId', handleDeleteConversation);

export default router;
