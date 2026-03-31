import express from 'express';
import { handleGetNotes, handleGetNoteById, handleDeleteNote, handleUploadNote } from '../controllers/noteController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 所有笔记路由都需要认证
router.get('/', authenticateToken, handleGetNotes);
router.get('/:id', authenticateToken, handleGetNoteById);
router.delete('/:id', authenticateToken, handleDeleteNote);
router.post('/upload', authenticateToken, handleUploadNote);

export default router;
