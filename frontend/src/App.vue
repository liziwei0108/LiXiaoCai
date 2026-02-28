<template>
  <van-config-provider class="chat-app">
    <!-- 导航栏：不再使用 fixed，作为 flex 子项自然固定在顶部，并去掉边框 -->
    <van-nav-bar
      title="💰 理财小助手"
      left-text="返回"
      left-arrow
      class="custom-nav"
      @click-left="onBack"
    >
      <template #right>
        <van-icon 
          :name="chat.isLoading ? 'chat' : 'chat-o'" 
          :color="chat.isLoading ? '#1989fa' : '#666'"
          size="20"
        />
      </template>
    </van-nav-bar>

    <!-- 消息列表区域：flex:1 自动撑开，可滚动 -->
    <div class="chat-main" ref="messagesContainer">
      <van-cell v-if="chat.messages.length === 0" class="welcome-cell">
        <span class="welcome-text">👋 你好！我是你的理财助手，有什么可以帮你的吗？</span>
      </van-cell>

      <div v-for="message in chat.messages" :key="message.id" class="message-wrapper">
        <!-- 用户消息：右对齐 -->
        <div v-if="message.role === 'user'" class="message-row user-row">
          <van-cell class="message-bubble user-bubble">
            <div v-for="part in message.parts" :key="part.type">
              <div v-if="part.type === 'text'" class="message-text">{{ part.text }}</div>
            </div>
          </van-cell>
          <van-icon name="contact" size="24" class="avatar user-avatar" />
        </div>

        <!-- AI 消息：左对齐 -->
        <div v-else class="message-row assistant-row">
          <van-icon name="service-o" size="24" class="avatar assistant-avatar" />
          <van-cell class="message-bubble assistant-bubble">
            <div v-for="part in message.parts" :key="part.type">
              <div v-if="part.type === 'text'" class="message-text">{{ part.text }}</div>
            </div>
          </van-cell>
        </div>
      </div>

      <!-- AI 正在输入指示器 -->
      <div v-if="chat.isLoading" class="message-row assistant-row">
        <van-icon name="service-o" size="24" class="avatar assistant-avatar" />
        <van-cell class="message-bubble assistant-bubble loading-bubble">
          <van-loading type="dots" size="18px" color="#666" />
        </van-cell>
      </div>

      <div ref="scrollAnchor"></div>
    </div>

    <!-- 底部输入区：作为 flex 子项自然固定在底部 -->
    <div class="input-area">
      <van-field
        v-model="input"
        type="text"
        placeholder="输入你的问题..."
        :disabled="chat.isLoading"
        autocomplete="off"
        @keyup.enter="handleSubmit"
      >
        <template #button>
          <van-button
            type="primary"
            :disabled="chat.isLoading || !input.trim()"
            @click="handleSubmit"
            size="small"
          >
            <template v-if="!chat.isLoading">发送</template>
            <template v-else>
              <van-loading type="spinner" size="16px" color="#fff" />
            </template>
          </van-button>
        </template>
      </van-field>
    </div>
  </van-config-provider>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { Chat } from '@ai-sdk/vue'
import { showToast } from 'vant'

const chat = new Chat({})
const input = ref('')
const messagesContainer = ref(null)
const scrollAnchor = ref(null)

const onBack = () => {
  showToast('返回功能待实现')
}

const handleSubmit = (e) => {
  e?.preventDefault()
  if (input.value.trim() && !chat.isLoading) {
    chat.sendMessage({ text: input.value })
    input.value = ''
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
  [() => chat.messages, () => chat.isLoading],
  scrollToBottom,
  { deep: true }
)
</script>

<style scoped>
/* 整体 flex 列布局，占满视口 */
.chat-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

/* 导航栏自定义：去掉默认下边框 */
.custom-nav {
  /* 移除下边框 */
  border-bottom: none !important;
}
/* 若 Vant 内部有伪元素边框，也一并去除 */
::v-deep(.van-nav-bar) {
  border-bottom: none !important;
  box-shadow: none !important;
}

/* 消息列表主区域：flex:1 自动撑开，滚动 */
.chat-main {
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 20px 12px;
  background-color: #ffffff;
  -webkit-overflow-scrolling: touch;
  max-width: 100%;
  margin: 0 auto;
  width: 100%;
}

/* 欢迎语单元格 */
.welcome-cell {
  margin-top: 20px;
  border-radius: 12px;
  text-align: center;
  background-color: #f5f5f5;
}
.welcome-text {
  font-size: 14px;
  color: #666;
  display: block;
  text-align: center;
}

/* 消息行容器 */
.message-wrapper {
  margin-bottom: 12px;
}
.message-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.user-row {
  justify-content: flex-end;
}
.assistant-row {
  justify-content: flex-start;
}

/* 头像样式 */
.avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.user-avatar {
  color: #1989fa;
}
.assistant-avatar {
  color: #07c160;
}

/* 消息气泡基础样式 */
.message-bubble {
  max-width: 70%;
  padding: 10px 14px !important;
  border-radius: 18px !important;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  transition: all 0.2s;
}
.message-text {
  white-space: pre-wrap;
  text-align: left; /* 明确左对齐 */
}

/* 用户气泡：纯色淡蓝色 */
.user-bubble {
  background-color: #e6f7ff !important;
  color: #282828 !important;
  border-bottom-right-radius: 4px !important;
  border: none;
}

/* AI 气泡：白色带边框 */
.assistant-bubble {
  background-color: white !important;
  color: #282828 !important;
  border: 1px solid #ebedf0;
  border-bottom-left-radius: 4px !important;
}

/* 加载气泡 */
.loading-bubble {
  background-color: #f0f2f5 !important;
  border-color: transparent;
  min-width: 60px;
  padding: 12px 16px !important;
}

/* 底部输入区：自然作为 flex 子项 */
.input-area {
  background-color: white;
  border: 1px solid #ebedf0;
  border-radius: 8px;
  padding: 8px 16px 8px 16px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.02);
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

@media (min-width: 768px) {
  .chat-main {
    max-width: 800px;
    padding: 20px 24px;
  }

  .message-bubble {
    max-width: 80%;
    font-size: 16px;
    padding: 12px 18px !important;
  }

  .avatar {
    width: 42px;
    height: 42px;
    font-size: 20px;
  }

  .input-area {
    max-width: 800px;
    padding: 12px 24px 16px;
  }

  ::v-deep(.van-field) {
    font-size: 16px;
  }

  ::v-deep(.van-button--small) {
    height: 38px;
    padding: 0 24px;
    font-size: 14px;
  }
}

@media (min-width: 1200px) {
  .chat-main {
    max-width: 900px;
  }
  .input-area {
    max-width: 900px;
  }
}
</style>