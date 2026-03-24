<template>
  <div class="chat-app">
    <header class="chat-header">
      <div class="header-content">
        <div class="logo">
          <div class="logo-avatar">
            <img src="/yuanbao.png" alt="圆宝" class="avatar-img" />
          </div>
          <div class="logo-text-wrap">
            <span class="logo-text">圆宝</span>
            <span class="logo-subtext">你的理财小助手</span>
          </div>
        </div>
        <div class="header-status" v-if="isLoading">
          <span class="status-paw"></span>
          <span class="status-text">喵呜~正在思考...</span>
        </div>
      </div>
    </header>

    <main class="chat-main">
      <div class="messages-wrapper">

        <div v-if="initMessages.length === 0 && messages.length === 0" class="welcome-section">
          <div class="welcome-avatar">
            <img src="/yuanbao.png" alt="圆宝" class="avatar-img" />
          </div>
          <h2 class="welcome-title">你好呀！我是圆宝~ 🐱</h2>
          <p class="welcome-desc">一只懂理财的金渐层，让我帮你管理财富吧！</p>
          <div class="quick-questions">
            <button class="quick-btn" @click="quickAsk('如何开始理财？')">
              <span class="btn-icon">💰</span>如何开始理财？
            </button>
            <button class="quick-btn" @click="quickAsk('新手适合买什么基金？')">
              <span class="btn-icon">📈</span>新手买什么基金？
            </button>
            <button class="quick-btn" @click="quickAsk('什么是复利？')">
              <span class="btn-icon">🔄</span>什么是复利？
            </button>
            <button class="quick-btn" @click="quickAsk('每月存多少钱合适？')">
              <span class="btn-icon">🐟</span>每月存多少钱？
            </button>
          </div>
        </div>

        <div v-if="initMessages.length > 0">
          <div v-for="message in initMessages" :key="message.id" class="message-item" :class="message.role">
            <div class="message-avatar" :class="message.role">
              <img v-if="message.role === 'user'" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='24' r='14' fill='%23FFE066'/%3E%3Cellipse cx='32' cy='44' rx='18' ry='14' fill='%23FFE066'/%3E%3Cellipse cx='32' cy='42' rx='14' ry='10' fill='%23FFF3B0'/%3E%3Ccircle cx='26' cy='22' r='3' fill='%231a1a1a'/%3E%3Ccircle cx='38' cy='22' r='3' fill='%231a1a1a'/%3E%3Ccircle cx='27' cy='21' r='1' fill='%23fff'/%3E%3Ccircle cx='39' cy='21' r='1' fill='%23fff'/%3E%3Cpath d='M30 28H34' stroke='%231a1a1a' stroke-width='2' stroke-linecap='round'/%3E%3Cellipse cx='32' cy='26' rx='2' ry='1.5' fill='%23FF9999'/%3E%3C/svg%3E" alt="用户" class="avatar-img" />
              <img v-else src="/yuanbao.png" alt="圆宝" class="avatar-img" />
            </div>
            <div class="message-content">
              <div v-for="part in message.parts" :key="part.type">
                <div v-if="part.type === 'text' && part.text" class="message-text" v-html="renderMarkdown(part.text)"></div>
              </div>
            </div>
          </div>
        </div>

        <div v-for="message in messages" :key="message.id" class="message-item" :class="message.role">
          <div class="message-avatar" :class="message.role">
            <img v-if="message.role === 'user'" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='24' r='14' fill='%23FFE066'/%3E%3Cellipse cx='32' cy='44' rx='18' ry='14' fill='%23FFE066'/%3E%3Cellipse cx='32' cy='42' rx='14' ry='10' fill='%23FFF3B0'/%3E%3Ccircle cx='26' cy='22' r='3' fill='%231a1a1a'/%3E%3Ccircle cx='38' cy='22' r='3' fill='%231a1a1a'/%3E%3Ccircle cx='27' cy='21' r='1' fill='%23fff'/%3E%3Ccircle cx='39' cy='21' r='1' fill='%23fff'/%3E%3Cpath d='M30 28H34' stroke='%231a1a1a' stroke-width='2' stroke-linecap='round'/%3E%3Cellipse cx='32' cy='26' rx='2' ry='1.5' fill='%23FF9999'/%3E%3C/svg%3E" alt="用户" class="avatar-img" />
            <img v-else src="/yuanbao.png" alt="圆宝" class="avatar-img" />
          </div>
          <div class="message-content">
            <div v-for="part in message.parts" :key="part.type">
              <div v-if="part.type === 'text' && part.text" class="message-text" v-html="renderMarkdown(part.text)"></div>
            </div>
          </div>
        </div>

        <div v-if="isLoading && !isStreaming" class="message-item assistant loading">
          <div class="message-avatar assistant loading-avatar">
            <img src="/yuanbao.png" alt="圆宝" class="avatar-img" />
          </div>
          <div class="message-content loading-content">
            <div class="loading-bubbles">
              <span class="bubble"></span>
              <span class="bubble"></span>
              <span class="bubble"></span>
            </div>
            <div class="loading-text-wrap">
              <span class="loading-text">圆宝正在思考...</span>
              <span class="loading-cat">🐱</span>
            </div>
          </div>
        </div>

        <div ref="scrollAnchor"></div>
      </div>
    </main>

    <footer class="chat-footer">
      <form class="input-form" @submit="handleSubmit">
        <div class="input-wrapper">
          <textarea
            v-model="input"
            placeholder="告诉圆宝你想了解什么..."
            :disabled="isLoading"
            autocomplete="off"
            class="chat-input"
            @keydown="handleKeydown"
          ></textarea>
          <button
            type="submit"
            class="send-btn"
            :disabled="isLoading || !input.trim()"
            :class="{ sending: isLoading }"
          >
            <svg v-if="!isLoading" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 12L20 12M20 12L12 5M20 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span v-else class="btn-loader"></span>
          </button>
        </div>
        <p class="disclaimer">🐾 内容仅供科普参考，不构成投资建议哦，喵~</p>
      </form>
    </footer>

    <div class="decoration-left">
      <span class="star">⭐</span>
      <span class="star">✨</span>
      <span class="paw">🐾</span>
    </div>
    <div class="decoration-right">
      <span class="star">💰</span>
      <span class="star">📈</span>
      <span class="paw">🐱</span>
    </div>
  </div>
</template>

<script setup>
import { watch, ref, nextTick, onMounted, computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'

marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true
})

const input = ref('')
const messages = ref([])
const scrollAnchor = ref(null)
const initMessages = ref([])
const isLoading = ref(false)
const isStreaming = ref(false)
let eventSource = null

const fetchHistory = async () => {
  try {
    const response = await fetch('/api/history')
    if (response.ok) {
      const history = await response.json()
      if (history && history.length > 0) {
        initMessages.value = history
      }
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
  }
}

const sendMessage = async (text) => {
  if (!text.trim() || isLoading.value) return

  const userMessage = {
    id: `msg_${Date.now()}`,
    role: 'user',
    content: text,
    parts: [{ type: 'text', text: text }]
  }

  messages.value = [...messages.value, userMessage]
  input.value = ''
  isLoading.value = true

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: text }],
        id: 'testId'
      })
    })

    if (!response.ok) {
      throw new Error('请求失败')
    }

    if (eventSource) {
      eventSource.close()
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    
    // 不预先添加空白消息，等开始流式输出时再添加
    let assistantMessageAdded = false

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            
            if (data.type === 'text') {
              // 标记开始流式输出
              if (!isStreaming.value) {
                isStreaming.value = true
                // 第一次收到文本时，添加助手消息
                if (!assistantMessageAdded) {
                  const assistantMessage = {
                    id: `msg_${Date.now()}_assistant`,
                    role: 'assistant',
                    content: data.text,
                    parts: [{ type: 'text', text: data.text }]
                  }
                  messages.value = [...messages.value, assistantMessage]
                  assistantMessageAdded = true
                }
              } else {
                // 实时更新消息内容
                const lastMessage = messages.value[messages.value.length - 1]
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.content += data.text
                  lastMessage.parts[0].text += data.text
                }
              }
            } else if (data.type === 'done') {
              // 完成时更新最终内容
              const lastMessage = messages.value[messages.value.length - 1]
              if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content = data.text
                lastMessage.parts[0].text = data.text
              }
            }
          } catch (e) {
            console.error('解析数据失败:', e)
          }
        }
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error)
  } finally {
    isLoading.value = false
    isStreaming.value = false
  }
}

const handleSubmit = (e) => {
  e?.preventDefault()
  if (input.value.trim() && !isLoading.value) {
    sendMessage(input.value)
    input.value = ''
  }
}

const handleKeydown = (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault()
    input.value += '\n'
  } else if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit(e)
  }
}

const quickAsk = (question) => {
  input.value = question
  handleSubmit()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollAnchor.value) {
      scrollAnchor.value.scrollIntoView({ behavior: 'smooth' })
    }
  })
}

watch(
  [messages, () => isLoading.value],
  scrollToBottom,
  { deep: true }
)

const renderMarkdown = (text) => {
  if (!text || text.trim() === '') {
    return '<span class="thinking-text">思考中...</span>'
  }
  return marked.parse(text)
}

onMounted(async() => {
  await fetchHistory()

  if(initMessages.value.length > 0) {
    scrollToBottom()
  }
})

</script>

<style scoped>
@import 'highlight.js/styles/github.css';

:root {
  --bg-primary: #FFFEF5;
  --bg-secondary: #FFF8E7;
  --bg-tertiary: #FFEFC7;
  --text-primary: #2D2D2D;
  --text-secondary: #5A5A5A;
  --text-tertiary: #8A8A8A;
  --accent-color: #FFB347;
  --accent-hover: #FF9F1C;
  --accent-dark: #E8941A;
  --user-bubble: #FFE4B5;
  --user-bubble-text: #5A4A2A;
  --assistant-bubble: #FFF8E7;
  --assistant-border: #FFE4B5;
  --border-color: #FFD89B;
  --shadow: 0 4px 20px rgba(255, 179, 71, 0.2);
  --radius: 16px;
  --radius-lg: 24px;
}

.chat-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #FFFEF5 0%, #FFF8E7 50%, #FFF5DC 100%);
  position: relative;
  overflow: hidden;
}

.decoration-left, .decoration-right {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 20px;
  opacity: 0.15;
  pointer-events: none;
  z-index: 0;
}

.decoration-left {
  left: 10px;
}

.decoration-right {
  right: 10px;
}

.decoration-left .star, .decoration-right .star,
.decoration-left .paw, .decoration-right .paw {
  font-size: 24px;
  animation: float 3s ease-in-out infinite;
}

.decoration-left .star:nth-child(1) { animation-delay: 0s; }
.decoration-left .star:nth-child(2) { animation-delay: 0.5s; }
.decoration-left .paw:nth-child(3) { animation-delay: 1s; }

.decoration-right .star:nth-child(1) { animation-delay: 0.3s; }
.decoration-right .star:nth-child(2) { animation-delay: 0.8s; }
.decoration-right .paw:nth-child(3) { animation-delay: 1.2s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.chat-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(180deg, rgba(255,254,245,0.98) 0%, rgba(255,248,231,0.95) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 2px solid var(--border-color);
  box-shadow: 0 4px 20px rgba(255, 179, 71, 0.1);
}

.header-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFE066 0%, #FFB347 100%);
  box-shadow: 0 4px 12px rgba(255, 179, 71, 0.3);
  overflow: hidden;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.logo-avatar svg, .logo-avatar .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-text-wrap {
  display: flex;
  flex-direction: column;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  background: linear-gradient(135deg, #FF9F1C 0%, #FFB347 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-subtext {
  font-size: 12px;
  color: var(--text-tertiary);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #FFF8E7 0%, #FFEFC7 100%);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  box-shadow: var(--shadow);
}

.status-paw {
  font-size: 16px;
  animation: pawTap 0.5s ease-in-out infinite;
}

@keyframes pawTap {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.status-text {
  font-size: 13px;
  color: var(--accent-dark);
  font-weight: 600;
}

.chat-main {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
  z-index: 1;
}

.messages-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 20px 120px;
}

.welcome-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.welcome-avatar {
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
  animation: wiggle 2s ease-in-out infinite;
}

@keyframes wiggle {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}

.welcome-avatar svg, .welcome-avatar .avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: drop-shadow(0 8px 20px rgba(255, 179, 71, 0.3));
}

.welcome-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.welcome-title span {
  display: inline-block;
}

.welcome-desc {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 28px;
  max-width: 320px;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  max-width: 480px;
}

.quick-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8E7 100%);
  border: 2px solid var(--border-color);
  border-radius: 20px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 6px;
}

.quick-btn:hover {
  background: linear-gradient(135deg, #FFF8E7 0%, #FFEFC7 100%);
  color: var(--accent-dark);
  border-color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 179, 71, 0.25);
}

.btn-icon {
  font-size: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.message-avatar.user {
  background: linear-gradient(135deg, #FFE066 0%, #FFB347 100%);
}

.message-avatar.assistant {
  background: linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 100%);
  border: 2px solid var(--border-color);
}

.message-avatar svg, .message-avatar .avatar-img {
  width: 36px;
  height: 36px;
  object-fit: cover;
}

.loading-avatar {
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.message-content {
  max-width: 85%;
  padding: 16px;
  border-radius: 24px;
  line-height: 1.6;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.message-item.user .message-content {
  background: linear-gradient(135deg, #FFE4B5 0%, #FFD699 100%);
  color: var(--user-bubble-text);
  border-top-right-radius: 4px;
  border: none;
}

.message-item.assistant .message-content {
  background: linear-gradient(135deg, #FFFFFF 0%, #FFFEF5 100%);
  color: var(--text-primary);
  border-top-left-radius: 4px;
  border: 2px solid var(--assistant-border);
}

.message-text {
  word-wrap: break-word;
  font-size: 16px;
}

.thinking-text {
  color: var(--text-tertiary);
  font-style: italic;
  opacity: 0.7;
}

.message-item.assistant .message-text :deep(p) {
  margin: 0 0 14px;
}

.message-item.assistant .message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-item.assistant .message-text :deep(code) {
  background: linear-gradient(135deg, #FFF8E7 0%, #FFEFC7 100%);
  padding: 2px 8px;
  border-radius: 6px;
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 13px;
  color: var(--accent-dark);
}

.message-item.assistant .message-text :deep(pre) {
  background: linear-gradient(135deg, #5A4A2A 0%, #3D2E1A 100%);
  padding: 14px;
  border-radius: 12px;
  overflow-x: auto;
  margin: 14px 0;
}
.message-item.assistant .message-text :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #FFE066;
}

.message-item.assistant .message-text :deep(ul),
.message-item.assistant .message-text :deep(ol) {
  padding-left: 24px;
  margin: 12px 0;
}

.message-item.assistant .message-text :deep(li) {
  margin: 6px 0;
}

.message-item.assistant .message-text :deep(blockquote) {
  border-left: 4px solid var(--accent-color);
  background: linear-gradient(135deg, #FFF8E7 0%, #FFEFC7 100%);
  padding: 12px 16px;
  border-radius: 0 12px 12px 0;
  margin: 14px 0;
  color: var(--text-secondary);
}

.message-item.assistant .message-text :deep(strong) {
  color: var(--accent-dark);
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.loading-bubbles {
  display: flex;
  gap: 6px;
}

.loading-bubbles .bubble {
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #FFB347 0%, #FF9F1C 100%);
  border-radius: 50%;
  animation: bubblePop 1.4s ease-in-out infinite;
}

.loading-bubbles .bubble:nth-child(1) { animation-delay: 0s; }
.loading-bubbles .bubble:nth-child(2) { animation-delay: 0.2s; }
.loading-bubbles .bubble:nth-child(3) { animation-delay: 0.4s; }

@keyframes bubblePop {
  0%, 60%, 100% { transform: scale(1); opacity: 0.6; }
  30% { transform: scale(1.3); opacity: 1; }
}

.loading-text-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-text {
  font-size: 13px;
  color: var(--text-tertiary);
}

.loading-cat {
  font-size: 16px;
  animation: catTail 0.5s ease-in-out infinite alternate;
}

@keyframes catTail {
  from { transform: rotate(-10deg); }
  to { transform: rotate(10deg); }
}

.loading-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.error-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.error-content {
  background: linear-gradient(135deg, #FFECEC 0%, #FFD6D6 100%);
  border: 2px solid #FFB3B3;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 4px 16px rgba(255, 179, 179, 0.2);
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.error-text {
  font-size: 14px;
  color: #D32F2F;
  margin: 0 0 20px;
  line-height: 1.5;
}

.retry-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #FFB347 0%, #FF9F1C 100%);
  border: none;
  border-radius: 20px;
  font-size: 14px;
  color: white;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(255, 179, 71, 0.3);
}

.retry-btn:hover {
  background: linear-gradient(135deg, #FF9F1C 0%, #E8941A 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 179, 71, 0.4);
}

.chat-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(255,254,245,0.98) 0%, rgba(255,254,245,0.95) 100%);
  backdrop-filter: blur(20px);
  border-top: 2px solid var(--border-color);
  padding: 14px 20px 24px;
  z-index: 100;
  box-shadow: 0 -4px 30px rgba(255, 179, 71, 0.1);
}

.input-form {
  max-width: 900px;
  margin: 0 auto;
}

.input-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8E7 100%);
  border: 2px solid var(--border-color);
  border-radius: 28px;
  padding: 12px 12px 12px 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(255, 179, 71, 0.1);
  min-height: 44px;
}

.input-wrapper:focus-within {
  border-color: var(--accent-color);
  box-shadow: 0 6px 24px rgba(255, 179, 71, 0.25);
  transform: translateY(-2px);
}

.chat-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 16px;
  color: var(--text-primary);
  outline: none;
  resize: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  min-height: 20px;
  max-height: 120px;
  overflow-y: auto;
}

.chat-input::placeholder {
  color: var(--text-tertiary);
}

.chat-input:focus {
  outline: none;
}

.send-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-color);
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #FFF8E7 0%, #FFEFC7 100%);
  transform: scale(1.1);
}

.send-btn:disabled {
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.send-btn.sending {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.btn-loader {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 179, 71, 0.3);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.disclaimer {
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 12px 0 0;
  padding: 0 20px;
}

</style>
