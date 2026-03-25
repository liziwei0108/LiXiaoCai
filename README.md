# 财咪

一个猫咪理财小助手\~
问答类机器人，1.0.0版本接入通义千问3.5，支持通用理财知识问答

### 1.0.0 功能

- 通用理财知识问答
- 流式AI响应：使用Vercel AI SDK实现流式AI响应输出及前后端AI消息交互
- 消息持久化：用户消息及AI回复存入PostgreSQL云数据库
- 系统提示词：专业金融助手 + 猫咪个性风格

#### 前端架构

技术栈

- 框架 : Vue 3.5.25
- 状态管理 : Pinia 3.0.4
- 构建工具 : Vite 7.3.1
- AI集成 : @ai-sdk/vue
- Markdown渲染 : marked + highlight.js

视觉设计 :

- 暖色调主题(金色/黄色系)
- 猫咪元素装饰(⭐🐾✨)
- 流畅动画(bounce/wiggle/pulse)
- 响应式布局

#### 后端架构

技术栈

- 框架 : Express 5.2.1
- AI集成 : @ai-sdk/openai + ai + Qwen3.5-27B
- 数据库 : PostgreSQL
- 配置管理 : dotenv

### 2.0.0 功能

- 支持我的理财笔记导入及embedding存储

  使用 /backend/batchScript/importNotes.js 脚本导入本地笔记

