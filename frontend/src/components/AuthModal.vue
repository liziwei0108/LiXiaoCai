<template>
  <div v-if="visible" class="auth-modal-overlay" @click="handleOverlayClick">
    <div class="auth-modal" @click.stop>
      <button class="close-btn" @click="close">×</button>
      
      <div class="auth-header">
        <h2 class="auth-title">{{ title }}</h2>
        <p class="auth-subtitle">{{ subtitle }}</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <!-- 邮箱输入 -->
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <input
            v-model="email"
            type="email"
            class="form-input"
            placeholder="请输入邮箱"
            required
            :disabled="loading"
          />
        </div>

        <!-- 密码输入 -->
        <div class="form-group">
          <label class="form-label">{{ isConfirmStep ? '确认密码' : '密码' }}</label>
          <input
            v-model="password"
            type="password"
            class="form-input"
            :placeholder="isConfirmStep ? '请再次输入密码' : '请输入密码'"
            required
            :disabled="loading"
          />
        </div>

        <!-- 昵称输入（仅在注册时显示） -->
        <div class="form-group" v-if="isConfirmStep">
          <label class="form-label">昵称（可选）</label>
          <input
            v-model="nickname"
            type="text"
            class="form-input"
            placeholder="给自己起个名字"
            maxlength="20"
            :disabled="loading"
          />
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>

        <!-- 提交按钮 -->
        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          <span v-else>{{ submitButtonText }}</span>
        </button>

        <!-- 返回按钮（仅在确认步骤显示） -->
        <button 
          v-if="isConfirmStep" 
          type="button" 
          class="back-btn" 
          @click="backToFirstStep"
          :disabled="loading"
        >
          返回上一步
        </button>
      </form>

      <!-- 底部提示 -->
      <div class="auth-footer">
        <p>💡 小提示：输入邮箱和密码后，系统会自动判断您是登录还是注册</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible', 'success'])

const authStore = useAuthStore()

// 表单数据
const email = ref('')
const password = ref('')
const nickname = ref('')
const firstPassword = ref('') // 存储第一步输入的密码

// 状态
const loading = ref(false)
const error = ref('')
const isConfirmStep = ref(false) // 是否是确认密码步骤

// 计算属性
const title = computed(() => {
  if (isConfirmStep.value) return '创建账号'
  return '欢迎回来'
})

const subtitle = computed(() => {
  if (isConfirmStep.value) return '请确认密码完成注册'
  return '输入邮箱和密码开始'
})

const submitButtonText = computed(() => {
  if (loading.value) return '处理中...'
  if (isConfirmStep.value) return '注册并登录'
  return '继续'
})

// 关闭弹窗
const close = () => {
  emit('update:visible', false)
  resetForm()
}

// 重置表单
const resetForm = () => {
  email.value = ''
  password.value = ''
  nickname.value = ''
  firstPassword.value = ''
  error.value = ''
  isConfirmStep.value = false
}

// 返回第一步
const backToFirstStep = () => {
  isConfirmStep.value = false
  password.value = firstPassword.value
  firstPassword.value = ''
  error.value = ''
}

// 处理遮罩层点击
const handleOverlayClick = () => {
  if (!loading.value) {
    close()
  }
}

// 提交表单
const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    if (!isConfirmStep.value) {
      // 第一步：尝试登录
      const result = await authStore.login(email.value, password.value)
      
      if (result.success) {
        // 登录成功
        emit('success')
        close()
      } else if (result.needRegister) {
        // 用户不存在，进入注册流程
        firstPassword.value = password.value
        password.value = ''
        isConfirmStep.value = true
      } else {
        // 其他错误（密码错误等）
        error.value = result.message || '登录失败'
      }
    } else {
      // 第二步：确认密码并注册
      if (password.value !== firstPassword.value) {
        error.value = '两次输入的密码不一致'
        loading.value = false
        return
      }

      const result = await authStore.register(
        email.value, 
        password.value, 
        nickname.value || email.value.split('@')[0]
      )

      if (result.success) {
        // 注册成功，自动登录
        const loginResult = await authStore.login(email.value, password.value)
        if (loginResult.success) {
          emit('success')
          close()
        } else {
          error.value = '注册成功但登录失败，请手动登录'
        }
      } else {
        error.value = result.message || '注册失败'
      }
    }
  } catch (err) {
    error.value = err.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-modal-overlay {
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.auth-modal {
  background: white;
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
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

.close-btn:hover {
  background: #eee;
  color: #333;
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(255, 140, 66, 0.3);
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.logo-img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px;
}

.auth-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-input {
  height: 48px;
  padding: 0 16px;
  border: 2px solid #eee;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.2s;
  background: #fafafa;
}

.form-input:focus {
  outline: none;
  border-color: #ff8c42;
  background: white;
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff2f0;
  border: 1px solid #ffccc7;
  border-radius: 8px;
  color: #ff4d4f;
  font-size: 14px;
}

.error-icon {
  font-size: 16px;
}

.submit-btn {
  height: 48px;
  background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 140, 66, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.back-btn {
  height: 44px;
  background: transparent;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #ccc;
}

.back-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
}

.auth-footer p {
  font-size: 12px;
  color: #999;
  margin: 0;
}

@media (max-width: 480px) {
  .auth-modal {
    margin: 20px;
    padding: 32px 24px;
  }
}
</style>
