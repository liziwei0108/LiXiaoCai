import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();
const port = config.server.port;

app.use(cors());
app.use(express.json());

app.use('/api', chatRoutes);

// 启动服务器
async function startServer() {
  try {
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
