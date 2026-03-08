import OpenAI from 'openai';

// 非流式
async function start() {
  console.log('执行非流式响应问题')

  const client = new OpenAI({
    baseURL: 'https://api-inference.modelscope.cn/v1',
    apiKey: 'ms-fbeac5e4-1836-43cc-997b-6b6fbe2628fe'
  });
  try {
    const response = await client.chat.completions.create({
      model: 'Qwen/Qwen3.5-27B',
      messages: [{
        'role':
          'user',
        'content': [{
          'type': 'text',
          'text': '你好，你是哪个模型',
        }]
      }],
    });

    // 输出返回结果
    console.log(response.choices[0].message.content);
  } catch (error: any) {
    console.error('请求失败:', error.response?.data || error.message);
  }
}

// 流式
async function stream() {
  console.log('执行流式响应问题')
  const client = new OpenAI({
    baseURL: 'https://api-inference.modelscope.cn/v1',
    apiKey: 'ms-fbeac5e4-1836-43cc-997b-6b6fbe2628fe'
  });
  try {
    const stream = await client.chat.completions.create({
      model: 'Qwen/Qwen3.5-27B',
      messages: [{
        'role':
          'user',
        'content': [{
          'type': 'text',
          'text': '描述这幅图',
        }, {
          'type': 'image_url',
          'image_url': {
            'url':
              'https://modelscope.oss-cn-beijing.aliyuncs.com/demo/images/audrey_hepburn.jpg',
          },
        }]
      }],
      stream: true,
    });

    // 输出返回结果
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) process.stdout.write(content)
    }
  } catch (error: any) {
    console.error('请求失败:', error.response?.data || error.message);
  }
}

// 根据命令行参数决定执行哪个函数
const args = process.argv.slice(2);
if (args.includes('--function=start')) {
  start();
} else if (args.includes('--function=stream')) {
  stream();
} else {
  console.log('请指定要执行的函数：--function=start 或 --function=stream');
}
