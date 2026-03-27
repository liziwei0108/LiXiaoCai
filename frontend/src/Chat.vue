<template>
  <div class="chat-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <button class="new-chat-btn" @click="createNewConversation">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>新增对话</span>
        </button>
        <button class="collapse-btn" @click="toggleSidebar" title="收起">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 17L6 12L11 7M18 17L13 12L18 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div class="conversation-list">
        <div v-if="conversations.length === 0" class="empty-state">
          <span class="empty-text">暂无对话</span>
        </div>
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="conversation-item"
          :class="{ active: currentConversationId === conv.id }"
          @click="switchConversation(conv.id)"
        >
          <div class="conv-info">
            <div class="conv-title">{{ conv.title }}</div>
            <div class="conv-time">{{ formatTime(conv.updatedAt) }}</div>
          </div>
          <button class="delete-btn" @click.stop="showDeleteConfirm(conv.id)" title="删除">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- 悬浮按钮（侧边栏收缩时显示） -->
    <div class="floating-buttons" v-if="isSidebarCollapsed">
      <button class="fab expand-btn" @click="toggleSidebar" title="展开对话列表">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="fab new-btn" @click="createNewConversation" title="新增对话">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- 删除确认弹窗 -->
    <ConfirmModal
      v-model:visible="showDeleteModal"
      :title="deleteModalTitle"
      :content="deleteModalContent"
      icon="🗑️"
      confirm-text="删除"
      cancel-text="取消"
      confirm-button-type="danger"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- 主聊天区域 -->
    <div class="chat-app" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
      <header class="chat-header">
        <div class="header-content">
          <div class="logo">
            <div class="logo-avatar">
              <img src="/yuanbao.png" alt="财咪" class="avatar-img" />
            </div>
            <div class="logo-text-wrap">
              <span class="logo-text">财咪</span>
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
          <div v-if="!currentConversationId && messages.length === 0" class="welcome-section">
            <div class="welcome-avatar">
              <img src="/yuanbao.png" alt="财咪" class="avatar-img" />
            </div>
            <h2 class="welcome-title">你好呀！我是财咪~ 🐱</h2>
            <p class="welcome-desc">一只懂理财的小猫咪，让我帮你管理财富吧！</p>
            <p class="welcome-hint">直接在下方输入问题开始聊天~</p>
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

          <div v-for="message in messages" :key="message.id" class="message-item" :class="message.role">
            <div v-if="message.role === 'assistant'" class="message-avatar" :class="message.role">
              <img src="/yuanbao.png" alt="财咪" class="avatar-img" />
            </div>
            <div class="message-content">
              <div v-if="message.reasoning || message.parts?.find(p => p.type === 'reasoning')?.text" class="reasoning-section">
                <div class="reasoning-header" @click="toggleReasoning(message.id)">
                  <span class="reasoning-icon">🤔</span>
                  <span class="reasoning-title">思考过程</span>
                  <span class="reasoning-toggle">{{ isReasoningExpanded(message.id) ? '▼' : '▶' }}</span>
                </div>
                <div v-show="isReasoningExpanded(message.id)" class="reasoning-content" v-html="renderMarkdown(message.reasoning || message.parts?.find(p => p.type === 'reasoning')?.text)"></div>
              </div>
              <div v-for="part in message.parts" :key="part.type">
                <div v-if="part.type === 'text' && part.text" class="message-text" v-html="renderMarkdown(part.text)"></div>
              </div>
            </div>
          </div>

          <div v-if="isLoading && !isStreaming" class="message-item assistant loading">
            <div class="message-avatar assistant loading-avatar">
              <img src="/yuanbao.png" alt="财咪" class="avatar-img" />
            </div>
            <div class="message-content loading-content">
              <div class="loading-bubbles">
                <span class="bubble"></span>
                <span class="bubble"></span>
                <span class="bubble"></span>
              </div>
              <div class="loading-text-wrap">
                <span class="loading-text">正在思考...</span>
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
              :placeholder="'告诉我你想了解什么...'"
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
  </div>
</template>

<script setup>
import { watch, ref, nextTick, onMounted } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import ConfirmModal from './components/ConfirmModal.vue'

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
const isLoading = ref(false)
const isStreaming = ref(false)
const expandedReasoning = ref(new Set())
const reasoningCompleted = ref(new Set())

// 会话相关状态
const conversations = ref([])
const currentConversationId = ref('')
const isSidebarCollapsed = ref(true)

// 删除确认弹窗状态
const showDeleteModal = ref(false)
const deleteTargetId = ref('')
const deleteModalTitle = ref('删除对话')
const deleteModalContent = ref('确定要删除这个对话吗？删除后无法恢复哦~')

// 切换思考过程的展开/折叠
const toggleReasoning = (messageId) => {
  if (expandedReasoning.value.has(messageId)) {
    expandedReasoning.value.delete(messageId)
  } else {
    expandedReasoning.value.add(messageId)
  }
}

// 检查思考过程是否展开
const isReasoningExpanded = (messageId) => {
  if (reasoningCompleted.value.has(messageId)) {
    return expandedReasoning.value.has(messageId)
  }
  return !expandedReasoning.value.has(messageId)
}

// 获取会话列表
const fetchConversations = async () => {
  try {
    const response = await fetch('/api/conversations')
    if (response.ok) {
      const data = await response.json()
      conversations.value = data
    }
  } catch (error) {
    console.error('获取会话列表失败:', error)
  }
}

// 获取特定会话的历史记录
const fetchHistoryById = async (conversationId) => {
  if (!conversationId) return
  
  try {
    const response = await fetch(`/api/history?conversationId=${conversationId}`)
    if (response.ok) {
      const history = await response.json()
      messages.value = history
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
  }
}

// 创建新会话
const createNewConversation = async () => {
  try {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    if (response.ok) {
      const newConversation = await response.json()
      conversations.value.unshift(newConversation)
      currentConversationId.value = newConversation.id
      messages.value = []
      input.value = ''
    }
  } catch (error) {
    console.error('创建会话失败:', error)
  }
}

// 切换会话
const switchConversation = async (conversationId) => {
  if (conversationId === currentConversationId.value) return
  
  currentConversationId.value = conversationId
  messages.value = []
  await fetchHistoryById(conversationId)
  scrollToBottom()
}

// 显示删除确认弹窗
const showDeleteConfirm = (conversationId) => {
  deleteTargetId.value = conversationId
  showDeleteModal.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!deleteTargetId.value) return
  
  try {
    const response = await fetch(`/api/conversations/${deleteTargetId.value}`, {
      method: 'DELETE'
    })
    if (response.ok) {
      conversations.value = conversations.value.filter(c => c.id !== deleteTargetId.value)
      if (currentConversationId.value === deleteTargetId.value) {
        currentConversationId.value = ''
        messages.value = []
      }
    }
  } catch (error) {
    console.error('删除会话失败:', error)
  } finally {
    showDeleteModal.value = false
    deleteTargetId.value = ''
  }
}

// 取消删除
const cancelDelete = () => {
  showDeleteModal.value = false
  deleteTargetId.value = ''
}

// 切换侧边栏
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  
  // 小于1小时显示分钟
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000))
    return minutes < 1 ? '刚刚' : `${minutes}分钟前`
  }
  // 小于24小时显示小时
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  }
  // 小于7天显示天数
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  }
  // 否则显示日期
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const sendMessage = async (text) => {
  if (!text.trim() || isLoading.value || !currentConversationId.value) return

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
        conversationId: currentConversationId.value
      })
    })

    if (!response.ok) {
      throw new Error('请求失败')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    
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
              if (!isStreaming.value) {
                isStreaming.value = true
                if (!assistantMessageAdded) {
                  const assistantMessage = {
                    id: `msg_${Date.now()}_assistant`,
                    role: 'assistant',
                    content: data.text,
                    reasoning: '',
                    parts: [
                      { type: 'reasoning', text: '' },
                      { type: 'text', text: data.text }
                    ]
                  }
                  messages.value = [...messages.value, assistantMessage]
                  assistantMessageAdded = true
                }
              } else {
                const lastMessage = messages.value[messages.value.length - 1]
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.content += data.text
                  const textPart = lastMessage.parts.find(p => p.type === 'text')
                  if (textPart) {
                    textPart.text += data.text
                  }
                }
              }
            } else if (data.type === 'reasoning') {
              if (!isStreaming.value) {
                isStreaming.value = true
                if (!assistantMessageAdded) {
                  const assistantMessage = {
                    id: `msg_${Date.now()}_assistant`,
                    role: 'assistant',
                    content: '',
                    reasoning: data.text,
                    parts: [
                      { type: 'reasoning', text: data.text },
                      { type: 'text', text: '' }
                    ]
                  }
                  messages.value = [...messages.value, assistantMessage]
                  assistantMessageAdded = true
                }
              } else {
                const lastMessage = messages.value[messages.value.length - 1]
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.reasoning = (lastMessage.reasoning || '') + data.text
                  const reasoningPart = lastMessage.parts.find(p => p.type === 'reasoning')
                  if (reasoningPart) {
                    reasoningPart.text = (reasoningPart.text || '') + data.text
                  }
                }
              }
            } else if (data.type === 'done') {
              const lastMessage = messages.value[messages.value.length - 1]
              if (lastMessage && lastMessage.role === 'assistant') {
                lastMessage.content = data.text
                lastMessage.reasoning = data.reasoning || lastMessage.reasoning
                const reasoningPart = lastMessage.parts.find(p => p.type === 'reasoning')
                const textPart = lastMessage.parts.find(p => p.type === 'text')
                if (reasoningPart) {
                  reasoningPart.text = data.reasoning || reasoningPart.text
                }
                if (textPart) {
                  textPart.text = data.text
                }
                reasoningCompleted.value.add(lastMessage.id)
              }
              // 刷新会话列表以更新时间
              await fetchConversations()
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

const handleSubmit = async (e) => {
  e?.preventDefault()
  if (!input.value.trim() || isLoading.value) return
  
  // 如果没有当前会话，先创建新会话
  if (!currentConversationId.value) {
    await createNewConversation()
  }
  
  // 确保会话创建成功后再发送消息
  if (currentConversationId.value) {
    sendMessage(input.value)
    input.value = ''
  }
}

const handleKeydown = async (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault()
    input.value += '\n'
  } else if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    await handleSubmit(e)
  }
}

const quickAsk = (question) => {
  if (!currentConversationId.value) {
    createNewConversation().then(() => {
      input.value = question
      handleSubmit()
    })
  } else {
    input.value = question
    handleSubmit()
  }
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

onMounted(async () => {
  await fetchConversations()
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

.chat-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #FFF8E7 0%, #FFEFC7 100%);
  border-right: 2px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 0;
  overflow: hidden;
  border-right: none;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  gap: 8px;
  align-items: center;
}

.new-chat-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #FFB347 0%, #FF9F1C 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255, 179, 71, 0.3);
}

.new-chat-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 179, 71, 0.4);
}

.new-chat-btn svg {
  width: 18px;
  height: 18px;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary);
}

.collapse-btn:hover {
  background: white;
  color: var(--accent-dark);
}

.collapse-btn svg {
  width: 18px;
  height: 18px;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.empty-text {
  font-size: 14px;
  color: #C9A86C;
  font-weight: 500;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.conversation-item:hover {
  background: rgba(255, 255, 255, 0.6);
}

.conversation-item.active {
  background: white;
  box-shadow: 0 2px 8px rgba(255, 179, 71, 0.15);
  border-left: 3px solid var(--accent-color);
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conv-time {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.delete-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  color: var(--text-tertiary);
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(255, 100, 100, 0.1);
  color: #ff6464;
}

.delete-btn svg {
  width: 14px;
  height: 14px;
}

/* 悬浮按钮样式 */
.floating-buttons {
  position: fixed;
  top: 16px;
  left: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1000;
}

.fab {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.fab svg {
  width: 22px;
  height: 22px;
}

.expand-btn {
  background: white;
  color: var(--text-secondary);
}

.expand-btn:hover {
  background: var(--bg-secondary);
  color: var(--accent-dark);
  transform: scale(1.1);
}

.new-btn {
  background: linear-gradient(135deg, #FFB347 0%, #FF9F1C 100%);
  color: white;
}

.new-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(255, 179, 71, 0.4);
}

/* 主聊天区域 */
.chat-app {
  flex: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #FFFEF5 0%, #FFF8E7 50%, #FFF5DC 100%);
  position: relative;
  overflow: hidden;
  transition: margin-left 0.3s ease;
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
  background: transparent;
  overflow: hidden;
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
  margin: 0 0 12px;
  max-width: 320px;
}

.welcome-hint {
  font-size: 13px;
  color: var(--accent-dark);
  margin: 0 0 28px;
  padding: 8px 16px;
  background: rgba(255, 179, 71, 0.1);
  border-radius: 20px;
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
  border: 1px solid var(--assistant-border);
}

.reasoning-section {
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 248, 231, 0.8);
  border: 1px solid var(--border-color);
}

.reasoning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  background: rgba(255, 239, 199, 0.5);
  transition: all 0.2s ease;
  user-select: none;
}

.reasoning-header:hover {
  background: rgba(255, 239, 199, 0.8);
}

.reasoning-icon {
  font-size: 14px;
}

.reasoning-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-dark);
  flex: 1;
}

.reasoning-toggle {
  font-size: 11px;
  color: var(--text-tertiary);
  transition: transform 0.2s ease;
}

.reasoning-content {
  padding: 14px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
  border-top: 1px dashed var(--border-color);
}

.reasoning-content :deep(p) {
  margin: 0 0 10px;
}

.reasoning-content :deep(p:last-child) {
  margin-bottom: 0;
}

.reasoning-content :deep(code) {
  background: rgba(255, 179, 71, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: var(--accent-dark);
}

.message-text {
  font-size: 15px;
  line-height: 1.7;
}

.message-text :deep(p) {
  margin: 0 0 12px;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(code) {
  background: rgba(255, 179, 71, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: var(--accent-dark);
}

.message-text :deep(pre) {
  background: #2d2d2d;
  padding: 16px;
  border-radius: 12px;
  overflow-x: auto;
  margin: 12px 0;
}

.message-text :deep(pre code) {
  background: none;
  padding: 0;
  color: #f8f8f2;
  font-size: 13px;
  line-height: 1.6;
}

.message-text :deep(ul), .message-text :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.message-text :deep(li) {
  margin-bottom: 6px;
}

.message-text :deep(h1), .message-text :deep(h2), .message-text :deep(h3) {
  margin: 16px 0 12px;
  color: var(--text-primary);
}

.message-text :deep(h1) { font-size: 20px; }
.message-text :deep(h2) { font-size: 18px; }
.message-text :deep(h3) { font-size: 16px; }

.message-text :deep(blockquote) {
  border-left: 4px solid var(--accent-color);
  padding-left: 16px;
  margin: 12px 0;
  color: var(--text-secondary);
  font-style: italic;
}

.message-text :deep(a) {
  color: var(--accent-dark);
  text-decoration: none;
  border-bottom: 1px solid var(--accent-color);
}

.message-text :deep(a:hover) {
  border-bottom: 2px solid var(--accent-dark);
}

.message-text :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 14px;
}

.message-text :deep(th), .message-text :deep(td) {
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  text-align: left;
}

.message-text :deep(th) {
  background: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-primary);
}

.message-text :deep(tr:nth-child(even)) {
  background: rgba(255, 248, 231, 0.5);
}

.thinking-text {
  color: var(--text-tertiary);
  font-style: italic;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFFEF5 100%);
  border: 1px solid var(--assistant-border);
  min-width: 120px;
}

.loading-bubbles {
  display: flex;
  gap: 6px;
}

.bubble {
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #FFB347 0%, #FF9F1C 100%);
  border-radius: 50%;
  animation: bubble 1.4s ease-in-out infinite;
}

.bubble:nth-child(1) { animation-delay: 0s; }
.bubble:nth-child(2) { animation-delay: 0.2s; }
.bubble:nth-child(3) { animation-delay: 0.4s; }

@keyframes bubble {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-8px); opacity: 1; }
}

.loading-text-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.loading-text {
  font-size: 13px;
  color: var(--text-secondary);
}

.loading-cat {
  font-size: 14px;
  animation: catBounce 0.6s ease-in-out infinite;
}

@keyframes catBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.chat-footer {
  position: sticky;
  bottom: 0;
  z-index: 100;
  background: linear-gradient(0deg, rgba(255,254,245,0.98) 0%, rgba(255,248,231,0.95) 100%);
  backdrop-filter: blur(20px);
  border-top: 2px solid var(--border-color);
  padding: 16px 20px 20px;
}

.input-form {
  max-width: 900px;
  margin: 0 auto;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  background: white;
  border: 2px solid var(--border-color);
  border-radius: 24px;
  padding: 12px 16px;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: var(--accent-color);
  box-shadow: 0 4px 24px rgba(255, 179, 71, 0.25);
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

.chat-input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
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

/* 响应式适配 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1001;
    transform: translateX(0);
  }
  
  .sidebar.collapsed {
    transform: translateX(-100%);
    width: 280px;
  }
  
  .chat-app {
    margin-left: 0;
  }
  
  .floating-buttons {
    top: auto;
    bottom: 100px;
    left: 16px;
  }
}
</style>
