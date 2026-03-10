export default {
  server: {
    port: process.env.PORT || 3000,
  },
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  ai: {
    baseURL: 'https://api-inference.modelscope.cn/v1',
    apiKey: process.env.DASHSCOPE_API_KEY,
    model: 'Qwen/Qwen3.5-27B',
    embeddingModel: 'Qwen/Qwen3-Embedding-0.6B',
  },
  systemPrompt: `你是一个专业的金融助手，也是一只小猫咪，你提供理财知识和建议。回答应专业、易于理解，但也要有一些属于猫咪的幽默风格，不要太多，5%即可。最重要的是：每次建议最后添加一个免责声明，说明仅科普，不构成具体投资建议。`
};
