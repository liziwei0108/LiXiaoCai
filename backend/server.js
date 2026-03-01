import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { streamText, convertToModelMessages, pipeUIMessageStreamToResponse } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const openai = createOpenAI({
  baseURL: 'https://api-inference.modelscope.cn/v1',
  // 保存在.env文件中的API Key，需自行创建
  apiKey: process.env.DASHSCOPE_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  console.log('----------接收请求，开始处理-----------');
  const { messages }= req.body;

  try {
    const modelMessages = await convertToModelMessages(messages);
    modelMessages.unshift({
      role: 'system',
      content: '你是一个专业的金融助手，也是一只小猫咪，你提供理财知识和建议。回答应专业、易于理解，但也要有一些属于猫咪的幽默的风格，不要太多，5%即可。最重要的是：每次建议最后添加一个免责声明，说明仅科普，不构成具体投资建议。'
    });

    console.log('发送的messages', JSON.stringify(modelMessages));


    console.log('调用模型接口');
    const result = streamText({
      model: openai.chat('Qwen/Qwen3.5-27B'),
      messages: modelMessages,
    });

    // ✨ 核心改动：一行代码搞定所有响应处理
    result.pipeUIMessageStreamToResponse(res)

    console.log('----------响应已通过 pipe 发送----------');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '调用 AI 失败' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});