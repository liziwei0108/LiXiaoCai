<template>
  <div class="chat-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <!-- 用户信息区域 -->
      <div class="user-section">
        <div class="user-info" v-if="authStore.isLoggedIn">
          <div class="user-avatar">
            {{ authStore.userInfo?.nickname?.[0] || '👤' }}
          </div>
          <div class="user-details">
            <span class="user-name">{{ authStore.userInfo?.nickname || '用户' }}</span>
            <span class="user-email">{{ authStore.userInfo?.email }}</span>
          </div>
          <button class="logout-btn" @click="handleLogout" title="退出登录">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="user-info guest" v-else>
          <div class="user-avatar">👤</div>
          <div class="user-details">
            <span class="user-name">游客</span>
            <span class="user-email"></span>
          </div>
          <button class="login-btn" @click="showAuthModal = true" title="登录/注册">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

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

      <!-- 我的笔记按钮 -->
      <div class="notes-section">
        <button class="notes-btn" @click="handleNotesClick">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="10,9 9,9 8,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>我的笔记库</span>
        </button>
      </div>
      
      <div class="conversation-list">
        <div v-if="conversations.length === 0" class="empty-state">
          <span class="empty-text">{{ authStore.isLoggedIn ? '暂无对话' : '登录后保留对话历史' }}</span>
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
      confirm-text="删除"
      cancel-text="取消"
      confirm-button-type="danger"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- 登录/注册弹窗 -->
    <AuthModal
      v-model:visible="showAuthModal"
      @success="handleAuthSuccess"
    />

    <!-- 笔记库登录提示弹窗 -->
    <div v-if="showNotesLoginPrompt" class="modal-overlay" @click="showNotesLoginPrompt = false">
      <div class="notes-login-modal" @click.stop>
        <div class="notes-login-header">
          <h3>我的笔记库</h3>
          <button class="close-btn" @click="showNotesLoginPrompt = false">×</button>
        </div>
        <div class="notes-login-content">
          <p class="notes-login-title">登录后才能使用笔记库哦</p>
          <p class="notes-login-desc">
            上传你的投资笔记，财咪会认真阅读并记住它们。当你询问持仓、策略相关问题时，财咪能结合你的笔记，给出更精准、更个性化的建议。
          </p>
          <button class="notes-login-btn" @click="showAuthModal = true; showNotesLoginPrompt = false">
            立即登录
          </button>
        </div>
      </div>
    </div>

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
              <button class="quick-btn" @click="quickAsk('查查我最新的投资笔记')">
                <span class="btn-icon">�</span>查查我的投资笔记
              </button>
            </div>
          </div>

          <div v-else-if="currentConversationId && messages.length === 0" class="empty-chat-hint">
            <p class="empty-hint-title">请输入你的问题~</p>
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
              <button class="quick-btn" @click="quickAsk('查查我最新的投资笔记')">
                <span class="btn-icon">�</span>查查我的投资笔记
              </button>
            </div>
          </div>

          <div v-for="message in messages" :key="message.id" class="message-item" :class="message.role">
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
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import hljs from 'highlight.js'
import ConfirmModal from './components/ConfirmModal.vue'
import AuthModal from './components/AuthModal.vue'
import { useAuthStore } from './stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()

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

// 登录/注册弹窗状态
const showAuthModal = ref(false)

// 笔记库登录提示弹窗状态
const showNotesLoginPrompt = ref(false)

// 获取请求头（包含认证信息）
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  }
  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`
  }
  return headers
}

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
    const response = await fetch('/api/conversations', {
      headers: getAuthHeaders()
    })
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
    const response = await fetch(`/api/history?conversationId=${conversationId}`, {
      headers: getAuthHeaders()
    })
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
  // 游客不创建会话，使用临时 ID
  if (!authStore.isLoggedIn) {
    currentConversationId.value = `guest_${Date.now()}`
    messages.value = []
    input.value = ''
    return
  }

  try {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: getAuthHeaders()
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
      method: 'DELETE',
      headers: getAuthHeaders()
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

// 登出
const handleLogout = async () => {
  await authStore.logout()
  // 刷新页面以清除当前会话状态
  window.location.reload()
}

// 处理笔记库按钮点击
const handleNotesClick = () => {
  if (!authStore.isLoggedIn) {
    // 未登录，显示提示弹窗
    showNotesLoginPrompt.value = true
    return
  }
  router.push('/notes')
}

// 登录/注册成功
const handleAuthSuccess = () => {
  // 刷新页面以同步用户数据
  window.location.reload()
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
      headers: getAuthHeaders(),
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
              // 只有登录用户才刷新会话列表
              if (authStore.isLoggedIn) {
                await fetchConversations()
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
  // 初始化认证状态
  await authStore.init()
  // 只有登录用户才获取会话列表
  if (authStore.isLoggedIn) {
    await fetchConversations()
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

.chat-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 用户信息区域 */
.user-section {
  padding: 16px;
  border-bottom: 1px solid rgba(255, 179, 71, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(255, 179, 71, 0.15);
}

.user-info.guest {
  background: rgba(255, 255, 255, 0.4);
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-btn,
.login-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 140, 66, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ff8c42;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.logout-btn:hover,
.login-btn:hover {
  background: rgba(255, 140, 66, 0.2);
}

.logout-btn svg,
.login-btn svg {
  width: 18px;
  height: 18px;
}

/* 侧边栏样式 */
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #FFF8E7 0%, #FFEFC7 100%);
  border-right: 1px solid #FFE4B5;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 0;
  border-right: none;
}

.sidebar-header {
  padding: 16px;
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
  padding: 12px;
  background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 140, 66, 0.3);
}

.new-chat-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 140, 66, 0.4);
}

.new-chat-btn svg {
  width: 18px;
  height: 18px;
}

.collapse-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 179, 71, 0.2);
  border-radius: 10px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s ease;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #ff8c42;
}

.collapse-btn svg {
  width: 18px;
  height: 18px;
}

/* 笔记按钮区域 */
.notes-section {
  padding: 0 16px 12px;
  border-bottom: 1px solid rgba(255, 179, 71, 0.2);
}

.notes-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(255, 140, 66, 0.1);
  border: 1px solid rgba(255, 140, 66, 0.2);
  border-radius: 10px;
  cursor: pointer;
  color: #ff8c42;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.notes-btn:hover {
  background: rgba(255, 140, 66, 0.2);
  transform: translateY(-1px);
}

.notes-btn svg {
  width: 18px;
  height: 18px;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 12px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.empty-text {
  color: #999;
  font-size: 14px;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 4px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.conversation-item:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 179, 71, 0.3);
}

.conversation-item.active {
  background: rgba(255, 140, 66, 0.1);
  border-color: rgba(255, 140, 66, 0.3);
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.conv-time {
  font-size: 12px;
  color: #999;
}

.delete-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #999;
  opacity: 0;
  transition: all 0.3s ease;
}

.conversation-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
}

.delete-btn svg {
  width: 16px;
  height: 16px;
}

/* 悬浮按钮 */
.floating-buttons {
  position: fixed;
  left: 20px;
  top: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fab {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #FFE4B5;
  border-radius: 12px;
  cursor: pointer;
  color: #ff8c42;
  box-shadow: 0 2px 12px rgba(255, 140, 66, 0.15);
  transition: all 0.3s ease;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(255, 140, 66, 0.25);
}

.fab svg {
  width: 22px;
  height: 22px;
}

/* 主聊天区域 */
.chat-app {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #FFFEF5 0%, #FFF8E7 100%);
  position: relative;
  transition: margin-left 0.3s ease;
}

.chat-app.sidebar-collapsed {
  margin-left: 0;
}

/* 头部 */
.chat-header {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 228, 181, 0.5);
}

.header-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-avatar {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(255, 140, 66, 0.3);
}

.logo-avatar .avatar-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.logo-text-wrap {
  display: flex;
  flex-direction: column;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #ff8c42;
  line-height: 1.2;
}

.logo-subtext {
  font-size: 12px;
  color: #999;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 140, 66, 0.1);
  border-radius: 20px;
}

.status-paw {
  width: 8px;
  height: 8px;
  background: #ff8c42;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

.status-text {
  font-size: 14px;
  color: #ff8c42;
}

/* 主内容区 */
.chat-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.messages-wrapper {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 欢迎区域 */
.welcome-section {
  text-align: center;
  padding: 60px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.welcome-avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(255, 140, 66, 0.3);
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.welcome-avatar .avatar-img {
  width: 70px;
  height: 70px;
  object-fit: contain;
}

.welcome-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
}

.welcome-desc {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.welcome-hint {
  font-size: 14px;
  color: #999;
  margin-bottom: 32px;
}

/* 空对话提示 */
.empty-chat-hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 24px;
}

.empty-hint-title {
  font-size: 18px;
  color: #666;
  text-align: center;
  margin: 0;
}

.quick-questions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: white;
  border: 1px solid #FFE4B5;
  border-radius: 24px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 140, 66, 0.1);
}

.quick-btn:hover {
  background: rgba(255, 140, 66, 0.1);
  border-color: #ff8c42;
  color: #ff8c42;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 140, 66, 0.2);
}

.btn-icon {
  font-size: 16px;
}

/* 消息样式 */
.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-avatar .avatar-img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.message-content {
  max-width: 80%;
  padding: 14px 18px;
  border-radius: 18px;
  line-height: 1.6;
}

.message-item.user .message-content {
  background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-item.assistant .message-content {
  background: white;
  border: 1px solid #FFE4B5;
  border-bottom-left-radius: 4px;
}

/* 思考过程 */
.reasoning-section {
  margin-bottom: 12px;
  background: rgba(255, 140, 66, 0.05);
  border-radius: 12px;
  overflow: hidden;
}

.reasoning-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  transition: background 0.3s ease;
}

.reasoning-header:hover {
  background: rgba(255, 140, 66, 0.1);
}

.reasoning-icon {
  font-size: 14px;
}

.reasoning-title {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #ff8c42;
}

.reasoning-toggle {
  font-size: 12px;
  color: #999;
}

.reasoning-content {
  padding: 12px 14px;
  font-size: 13px;
  color: #666;
  border-top: 1px solid rgba(255, 140, 66, 0.1);
  background: rgba(255, 255, 255, 0.5);
}

.reasoning-content :deep(p) {
  margin: 0 0 8px;
}

.reasoning-content :deep(p:last-child) {
  margin-bottom: 0;
}

/* 消息文本 */
.message-text {
  font-size: 15px;
}

.message-text :deep(p) {
  margin: 0 0 12px;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

/* 列表样式优化 */
.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.message-text :deep(li) {
  margin-bottom: 6px;
}

.message-text :deep(li:last-child) {
  margin-bottom: 0;
}

.message-text :deep(pre) {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.message-text :deep(code) {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
}

.message-text :deep(p code) {
  background: rgba(255, 140, 66, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  color: #ff8c42;
}

.thinking-text {
  color: #999;
  font-style: italic;
}

/* 加载动画 */
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.loading-bubbles {
  display: flex;
  gap: 6px;
}

.bubble {
  width: 10px;
  height: 10px;
  background: #ff8c42;
  border-radius: 50%;
  animation: bubble 1.4s ease-in-out infinite;
}

.bubble:nth-child(1) {
  animation-delay: 0s;
}

.bubble:nth-child(2) {
  animation-delay: 0.2s;
}

.bubble:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bubble {
  0%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-text {
  font-size: 14px;
  color: #999;
}

.loading-cat {
  font-size: 14px;
  animation: wiggle 0.5s ease-in-out infinite;
}

@keyframes wiggle {
  0%, 100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

/* 输入区域 */
.chat-footer {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 228, 181, 0.5);
}

.input-form {
  max-width: 900px;
  margin: 0 auto;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  background: white;
  border: 2px solid #FFE4B5;
  border-radius: 20px;
  padding: 8px 8px 8px 20px;
  box-shadow: 0 2px 12px rgba(255, 140, 66, 0.1);
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #ff8c42;
  box-shadow: 0 4px 16px rgba(255, 140, 66, 0.2);
}

.chat-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  line-height: 1.5;
  resize: none;
  outline: none;
  min-height: 24px;
  max-height: 120px;
  padding: 8px 0;
  color: #333;
}

.chat-input::placeholder {
  color: #bbb;
}

.send-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: white;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 140, 66, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn svg {
  width: 20px;
  height: 20px;
}

.btn-loader {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.disclaimer {
  text-align: center;
  font-size: 12px;
  color: #bbb;
  margin-top: 12px;
}

/* 装饰元素 */
.decoration-left,
.decoration-right {
  position: fixed;
  pointer-events: none;
  z-index: 0;
}

.decoration-left {
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.decoration-right {
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
}

.decoration-left .star,
.decoration-left .paw,
.decoration-right .star,
.decoration-right .paw {
  display: block;
  font-size: 24px;
  margin: 40px 0;
  opacity: 0.15;
  animation: float 6s ease-in-out infinite;
}

.decoration-left .star:nth-child(2),
.decoration-right .star:nth-child(2) {
  animation-delay: 2s;
}

.decoration-left .paw,
.decoration-right .paw {
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 179, 71, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 179, 71, 0.5);
}

/* 响应式 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 200;
    box-shadow: 2px 0 20px rgba(0, 0, 0, 0.1);
  }

  .sidebar.collapsed {
    transform: translateX(-100%);
    width: 280px;
  }

  .chat-app {
    margin-left: 0 !important;
  }

  .floating-buttons {
    left: 16px;
    top: 16px;
  }

  .chat-header {
    padding: 12px 16px;
  }

  .chat-main {
    padding: 16px;
  }

  .chat-footer {
    padding: 16px;
  }

  .message-content {
    max-width: 90%;
  }

  .quick-questions {
    flex-direction: column;
    align-items: stretch;
  }

  .quick-btn {
    justify-content: center;
  }

  .decoration-left,
  .decoration-right {
    display: none;
  }
}

/* 笔记库登录提示弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.notes-login-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

.notes-login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.notes-login-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.notes-login-header .close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.notes-login-header .close-btn:hover {
  background: #eee;
  color: #333;
}

.notes-login-content {
  padding: 24px;
}

.notes-login-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 12px;
  text-align: center;
}

.notes-login-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.7;
  margin: 0 0 24px;
  text-align: center;
}

.notes-login-btn {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notes-login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 140, 66, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
