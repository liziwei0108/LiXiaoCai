import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import chatRoutes from './routes/chatRoutes.js';
import { initTestConversation } from './services/dbService.js';

const app = express();
const port = config.server.port;

app.use(cors());
app.use(express.json());

app.use('/api', chatRoutes);

// 启动服务器并初始化 testId 会话
async function startServer() {
  try {
    // 初始化 testId 会话
    await initTestConversation();
    
    // 启动服务器
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();