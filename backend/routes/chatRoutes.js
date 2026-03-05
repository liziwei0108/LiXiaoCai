import express from 'express';
import { handleChat, handleGetHistory } from '../controllers/chatController.js';

const router = express.Router();

router.post('/chat', handleChat);
router.get('/history', handleGetHistory);

export default router;
