import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import chatRoutes from './routes/chatRoutes.js';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';

const app = express();
const port = config.server.port;

// CORS 配置
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://your-frontend.vercel.app', 'https://*.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api', chatRoutes);

// 获取服务器出口 IP（用于配置数据库白名单）
app.get('/api/ip', async (req, res) => {
  try {
    // 尝试多个 IP 查询服务
    let ip = null;
    const services = [
      'https://httpbin.org/ip',
      'https://api.ipify.org?format=json',
      'https://ipinfo.io/json'
    ];
    
    for (const url of services) {
      try {
        const response = await fetch(url, { timeout: 5000 });
        const data = await response.json();
        // 不同服务返回格式不同
        ip = data.origin || data.ip || (data.ip ? data.ip : null);
        if (ip) break;
      } catch (e) {
        continue;
      }
    }
    
    if (!ip) {
      throw new Error('所有 IP 查询服务都失败了');
    }
    
    // 清理 IP（去掉端口号）
    ip = ip.split(',')[0].trim();
    if (ip.includes(':')) {
      ip = ip.split(':')[0];
    }
    
    res.json({
      ip: ip,
      message: '请将此 IP 添加到阿里云数据库白名单',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: '获取 IP 失败', 
      details: error.message,
      fallback: '你可以直接在 Render 的 Shell 中运行: curl https://httpbin.org/ip'
    });
  }
});

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
