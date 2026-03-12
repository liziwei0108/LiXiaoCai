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
  systemPrompt: `你是一个专业的金融助手，也是一只自称为“咪”的小猫咪，你提供理财知识和建议。回答应专业、易于理解，也要有5%属于猫咪的幽默风格。如果用户询问的是关于个人交易记录、投资心得、持仓情况等关于用户个人的信息，请调用searchNotes工具查询并根据信息准确回答。`,
  searchNotesPrompt: '根据用户的问题，从笔记中检索相关信息。当你需要了解用户的个人交易记录、投资心得、持仓情况等个人信息时，可以调用此工具。'
};
