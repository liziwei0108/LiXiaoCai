import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const loading = ref(false)
  const error = ref('')

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const userInfo = computed(() => user.value)

  // Actions
  // 设置认证信息
  function setAuth(userData, authToken) {
    user.value = userData
    token.value = authToken
    localStorage.setItem('token', authToken)
  }

  // 清除认证信息
  function clearAuth() {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
  }

  // 注册
  async function register(email, password, nickname = '') {
    loading.value = true
    error.value = ''

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, nickname })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details?.[0] || '注册失败')
      }

      setAuth(data.user, data.token)
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 登录
  async function login(email, password) {
    loading.value = true
    error.value = ''

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        // 检查是否是用户不存在的错误
        if (data.error && (data.error.includes('用户不存在') || data.error.includes('未找到'))) {
          return { success: false, needRegister: true, message: '用户不存在，需要注册' }
        }
        throw new Error(data.error || '登录失败')
      }

      setAuth(data.user, data.token)
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 获取当前用户信息
  async function fetchUserInfo() {
    if (!token.value) return

    loading.value = true

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        user.value = data.user
      } else if (response.status === 401 || response.status === 403) {
        // Token 无效或过期
        clearAuth()
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 登出
  async function logout() {
    if (token.value) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })
      } catch (err) {
        console.error('登出请求失败:', err)
      }
    }

    clearAuth()
  }

  // 初始化（应用启动时调用）
  async function init() {
    if (token.value) {
      await fetchUserInfo()
    }
  }

  return {
    // State
    user,
    token,
    loading,
    error,
    // Getters
    isLoggedIn,
    userInfo,
    // Actions
    register,
    login,
    logout,
    fetchUserInfo,
    init,
    clearAuth
  }
})
