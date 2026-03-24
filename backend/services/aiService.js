import { OpenAI } from 'openai';
import config from '../config/index.js';
import { saveMessage, updateConversationTime, searchNotesFromDb } from './dbService.js';

const openai = new OpenAI({
  baseURL: config.ai.baseURL,
  apiKey: config.ai.apiKey,
});

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: config.ai.embeddingModel,
    input: text,
  });
  return response.data[0].embedding;
}

async function searchNotes(query, limit = 5) {
  const embedding = await generateEmbedding(query);
  const res = await searchNotesFromDb(embedding, limit);
  return res;
}

// 定义工具列表
const tools = [
  { type: 'web_search' },
  {
    type: 'function',
    name: 'searchNotes',
    description: config.searchNotesPrompt,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '检索关键词，通常是用户的问题或关键实体',
        },
      },
      required: ['query'],
    },
  },
];

// 工具函数映射表
const toolHandlers = {
  searchNotes: async (args) => {
    console.log(`开始使用searchNotes工具，检索笔记关键词: ${args.query}`);
    const result = await searchNotes(args.query);
    console.log(`工具返回结果:`, result);
    return result;
  },
  // 内置工具 web_search 由模型自动执行，我们只需要记录
  web_search: async (args) => {
    console.log('web_search 是内置工具，由模型自动执行');
    return '内置搜索工具已执行';
  },
};

// 执行工具调用
async function executeTool(functionCall) {
  const { name, arguments: argsStr, call_id } = functionCall;
  const args = JSON.parse(argsStr);
  console.log(`调用工具 [${name}]，参数:`, args);

  const handler = toolHandlers[name];
  if (!handler) {
    console.warn(`未找到工具处理器: ${name}`);
    return `工具 ${name} 未实现`;
  }

  const result = await handler(args);
  return result;
}

// 发送文本数据到客户端
function sendTextChunk(res, text) {
  const data = {
    type: 'text',
    text,
    id: `msg_${Date.now()}`,
    role: 'assistant',
    parts: [{ type: 'text', text }],
  };
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// 发送工具调用信息到客户端
function sendToolCall(res, functionCall, result) {
  const data = {
    type: 'tool_call',
    name: functionCall.name,
    arguments: functionCall.arguments,
    call_id: functionCall.call_id,
    result,
  };
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// 发送完成信号
function sendDone(res, finalText) {
  const data = {
    type: 'done',
    text: finalText,
    id: `msg_${Date.now()}`,
    role: 'assistant',
    parts: [{ type: 'text', text: finalText }],
  };
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  res.end();
}

// 发送错误信息
function sendError(res, message) {
  res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
  res.end();
}

// 流式获取模型响应并处理输出
async function streamResponse(conversation, res) {
  const response = await openai.responses.create({
    model: config.ai.model,
    input: conversation,
    instructions: config.systemPrompt,
    tools: tools,
    stream: true,
  });

  let fullText = '';
  const functionCalls = [];
  let currentFunctionCall = null;

  for await (const event of response) {
    // 打印所有事件类型，便于调试
    if (event.type !== 'response.output_text.delta') {
      console.log('收到事件:', event.type, JSON.stringify(event).substring(0, 200));
    }

    switch (event.type) {
      // 文本增量输出
      case 'response.output_text.delta':
        sendTextChunk(res, event.delta);
        fullText += event.delta;
        break;

      // 函数调用开始（自定义函数）
      case 'response.function_call':
        currentFunctionCall = {
          name: event.name,
          call_id: event.call_id,
          arguments: '',
        };
        console.log('函数调用开始:', currentFunctionCall.name);
        break;

      // 函数参数增量
      case 'response.function_call_arguments.delta':
        if (currentFunctionCall) {
          currentFunctionCall.arguments += event.delta;
        }
        break;

      // 函数参数完成 - 仅记录日志，实际在 output_item.done 中处理
      case 'response.function_call_arguments.done':
        console.log('函数参数完成:', event.name, '参数:', event.arguments);
        // 从事件中提取完整的函数调用信息
        if (event.name && event.call_id) {
          currentFunctionCall = {
            name: event.name,
            call_id: event.call_id,
            arguments: event.arguments || '{}',
          };
        }
        break;

      // 输出项添加（包含内置工具和自定义工具）
      case 'response.output_item.added':
        // 事件可能是 event.item 或 event.output_item
        const addedItem = event.item || event.output_item;
        if (addedItem) {
          const item = addedItem;
          // 只处理自定义函数调用 - 初始化
          // 内置工具（如 web_search）由模型自动执行，不需要我们处理
          if (item.type === 'function_call') {
            console.log('从 output_item.added 获取函数调用:', item.name);
            currentFunctionCall = {
              name: item.name,
              call_id: item.call_id,
              arguments: item.arguments || '',
            };
          }
        }
        break;

      // 输出项完成 - 这是关键，在这里确认函数调用
      case 'response.output_item.done':
        // 事件可能是 event.item 或 event.output_item
        const doneItem = event.item || event.output_item;
        console.log('output_item.done, item类型:', doneItem?.type);
        if (doneItem) {
          const item = doneItem;
          // 只处理自定义函数调用
          // 内置工具由模型自动执行，结果直接包含在模型响应中
          if (item.type === 'function_call') {
            // 优先使用 item 中的完整信息
            const fc = {
              name: item.name || (currentFunctionCall && currentFunctionCall.name),
              call_id: item.call_id || (currentFunctionCall && currentFunctionCall.call_id),
              arguments: item.arguments || (currentFunctionCall && currentFunctionCall.arguments) || '{}',
            };
            if (fc.name && fc.call_id) {
              functionCalls.push(fc);
              console.log('从 output_item.done 添加函数调用:', fc.name, '参数:', fc.arguments);
            }
            currentFunctionCall = null;
          }
        }
        break;

      // 响应完成
      case 'response.completed':
        console.log('流式响应完成，检测到', functionCalls.length, '个工具调用');
        break;
    }
  }

  return { fullText, functionCalls };
}

// 主函数：处理流式聊天响应
export async function streamChatResponse(messages, id, res) {
  if (!id) {
    console.error('id 不能为空');
    throw new Error('id 不能为空');
  }
  console.log('----获取会话id', id);

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const conversation = [...messages];
  let finalResponseText = '';

  try {
    // 进入工具调用循环
    while (true) {
      console.log(`发送请求，conversation长度: ${conversation.length}`);

      // 获取流式响应
      const { fullText, functionCalls } = await streamResponse(conversation, res);
      finalResponseText += fullText;

      // 如果没有工具调用，结束循环
      if (functionCalls.length === 0) {
        console.log('没有工具调用，直接返回结果');
        break;
      }

      console.log(`检测到 ${functionCalls.length} 个工具调用`);

      // 处理所有工具调用
      for (const fc of functionCalls) {
        // 执行工具
        const toolResult = await executeTool(fc);

        // 发送工具调用信息到客户端
        sendToolCall(res, fc, toolResult);

        // 将工具调用和结果添加到对话上下文
        conversation.push({
          type: 'function_call',
          name: fc.name,
          arguments: fc.arguments,
          call_id: fc.call_id,
        });

        conversation.push({
          type: 'function_call_output',
          call_id: fc.call_id,
          output: JSON.stringify(toolResult),
        });
      }

      // 继续循环，让模型基于工具结果生成回复
      console.log('工具调用完成，继续请求模型生成回复');
    }

    // 发送完成信号
    sendDone(res, finalResponseText);

    console.log('当前回答完成');
    console.log('最终响应文本:', finalResponseText);

    // 保存 AI 响应到数据库
    try {
      const assistantParts = [{ type: 'text', text: finalResponseText }];
      await saveMessage('testId', 'assistant', finalResponseText, assistantParts);
      await updateConversationTime('testId');
      console.log('AI 响应存储成功并更新会话时间');
    } catch (error) {
      console.error('存储 AI 响应失败:', error);
    }
  } catch (error) {
    console.error('流式响应错误:', error);
    sendError(res, error.message);
  }

  return finalResponseText;
}
