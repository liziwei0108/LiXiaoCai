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

export async function streamChatResponse(messages, id, res) {
  if (!id) {
    console.error('id 不能为空');
    throw new Error('id 不能为空');
  }
  console.log('----获取会话id', id);

  const systemMessage = {
    role: 'system',
    content: config.systemPrompt,
  };

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

  const conversation = [systemMessage, ...messages];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let finalResponseText = '';
  let functionCalls = [];
  let callId = null;
  let currentFunctionArgs = '';
  let currentFunctionName = '';
  let currentCallId = null;

  try {
    const response = await openai.responses.create({
      model: config.ai.model,
      input: conversation,
      tools: tools,
      stream: true,
    });

    for await (const event of response) {
      console.log('收到事件:', event.type);

      if (event.type === 'response.output_text.delta' || event.type === 'response.output_text.value') {
        const textData = {
          type: 'text',
          text: event.text || event.delta,
          id: `msg_${Date.now()}`,
          role: 'assistant',
          parts: [{ type: 'text', text: event.text || event.delta }]
        };
        res.write(`data: ${JSON.stringify(textData)}\n\n`);
        finalResponseText += event.text || event.delta;
      } else if (event.type === 'response.function_call_arguments.delta') {
        currentFunctionArgs += event.delta;
        console.log('收集函数参数:', event.delta);
      } else if (event.type === 'response.function_call_arguments.done') {
        console.log('function_call_arguments 完成');
        console.log('完整参数:', currentFunctionArgs);
        // 对于自定义工具，可能没有 function_call 事件，需要在这里处理
        if (currentFunctionArgs && !currentFunctionName) {
          // 尝试从参数中推断函数名
          try {
            const args = JSON.parse(currentFunctionArgs);
            if (args.query !== undefined) {
              currentFunctionName = 'searchNotes';
              currentCallId = `call_${Date.now()}`;
            }
          } catch (e) {
            console.log('无法解析参数:', e);
          }
        }
      } else if (event.type === 'response.function_call') {
        currentFunctionName = event.name;
        currentCallId = event.call_id;
        functionCalls.push({
          name: event.name,
          arguments: currentFunctionArgs,
          call_id: event.call_id
        });
        callId = event.call_id;
        console.log(`函数调用: ${event.name}, 参数: ${currentFunctionArgs}`);
        currentFunctionArgs = '';
        currentFunctionName = '';
        currentCallId = null;
      } else if (event.type === 'response.output_item.done') {
        // 在 output_item.done 时检查是否有未处理的函数调用
        if (currentFunctionArgs && currentFunctionName && !functionCalls.find(fc => fc.arguments === currentFunctionArgs)) {
          console.log(`在 output_item.done 时添加函数调用: ${currentFunctionName}`);
          functionCalls.push({
            name: currentFunctionName,
            arguments: currentFunctionArgs,
            call_id: currentCallId || `call_${Date.now()}`
          });
          currentFunctionArgs = '';
          currentFunctionName = '';
          currentCallId = null;
        }
      } else if (event.type === 'response.output_item.added') {
        console.log('输出项添加:', JSON.stringify(event.output_item, null, 2));
        // 检查是否是函数调用项
        if (event.output_item && event.output_item.type === 'function_call') {
          currentFunctionName = event.output_item.name;
          currentCallId = event.output_item.call_id;
          if (event.output_item.arguments) {
            currentFunctionArgs = event.output_item.arguments;
          }
          console.log(`从 output_item.added 获取函数调用: ${currentFunctionName}`);
        }
      } else if (event.type === 'response.completed') {
        console.log('响应完成');
      }
    }

    console.log(`functionCalls 数组长度: ${functionCalls.length}`);
    console.log(`functionCalls 内容:`, functionCalls);

    if (functionCalls.length > 0) {
      for (const fc of functionCalls) {
        console.log(`开始调用工具: ${fc.name}`);
        console.log(`工具参数: ${fc.arguments}`);

        let toolResult;
        if (fc.name === 'searchNotes') {
          const args = JSON.parse(fc.arguments);
          console.log(`开始使用searchNotes工具，检索笔记关键词: ${args.query}`);
          toolResult = await searchNotes(args.query);
        } else {
          toolResult = '工具调用成功';
        }

        console.log(`工具返回结果: ${toolResult}`);

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

        console.log(`第二轮请求的 conversation 长度: ${conversation.length}`);

        const toolCallData = {
          type: 'tool_call',
          name: fc.name,
          arguments: fc.arguments,
          call_id: fc.call_id,
          result: toolResult
        };
        res.write(`data: ${JSON.stringify(toolCallData)}\n\n`);
      }

      functionCalls = [];

      const secondResponse = await openai.responses.create({
        model: config.ai.model,
        input: conversation,
        tools: tools,
        stream: true,
      });

      for await (const event of secondResponse) {
        console.log('第二轮事件:', event.type);

        if (event.type === 'response.output_text.delta' || event.type === 'response.output_text.value') {
          const textData = {
            type: 'text',
            text: event.text || event.delta,
            id: `msg_${Date.now()}`,
            role: 'assistant',
            parts: [{ type: 'text', text: event.text || event.delta }]
          };
          res.write(`data: ${JSON.stringify(textData)}\n\n`);
          finalResponseText += event.text || event.delta;
        }
      }
    }

    const finalData = {
      type: 'done',
      text: finalResponseText,
      id: `msg_${Date.now()}`,
      role: 'assistant',
      parts: [{ type: 'text', text: finalResponseText }]
    };
    res.write(`data: ${JSON.stringify(finalData)}\n\n`);
    res.end();

    console.log('当前回答完成');
    console.log('最终响应文本:', finalResponseText);

    try {
      const assistantParts = [{ type: 'text', text: finalResponseText }];

      await saveMessage(
        'testId',
        'assistant',
        finalResponseText,
        assistantParts
      );

      await updateConversationTime('testId');

      console.log('AI 响应存储成功并更新会话时间');
    } catch (error) {
      console.error('存储 AI 响应失败:', error);
    }
  } catch (error) {
    console.error('流式响应错误:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    res.end();
  }

  return finalResponseText;
}
