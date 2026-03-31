<template>
  <div class="notes-page">
    <!-- 头部 -->
    <header class="notes-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack" title="返回">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h1 class="page-title">我的笔记库</h1>
      </div>
      <button class="upload-btn" @click="triggerFileUpload">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>上传笔记</span>
      </button>
    </header>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".md,.txt"
      style="display: none"
      @change="handleFileChange"
    />

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="notes.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <p class="empty-text">还没有笔记</p>
      <p class="empty-hint">点击右上角上传笔记</p>
    </div>

    <!-- 笔记列表 -->
    <div v-else class="notes-content">
      <!-- 当日 -->
      <section v-if="todayNotes.length > 0" class="note-section">
        <h2 class="section-title">
          当日
        </h2>
        <div class="notes-grid">
          <NoteCard
            v-for="note in todayNotes"
            :key="note.id"
            :note="note"
            @click="openNoteDetail(note)"
            @delete="showDeleteConfirm(note)"
          />
        </div>
      </section>

      <!-- 近一周 -->
      <section v-if="weekNotes.length > 0" class="note-section">
        <h2 class="section-title">
          近一周
        </h2>
        <div class="notes-grid">
          <NoteCard
            v-for="note in weekNotes"
            :key="note.id"
            :note="note"
            @click="openNoteDetail(note)"
            @delete="showDeleteConfirm(note)"
          />
        </div>
      </section>

      <!-- 一周前 -->
      <section v-if="olderNotes.length > 0" class="note-section">
        <h2 class="section-title">
          一周前
        </h2>
        <div class="notes-grid">
          <NoteCard
            v-for="note in olderNotes"
            :key="note.id"
            :note="note"
            @click="openNoteDetail(note)"
            @delete="showDeleteConfirm(note)"
          />
        </div>
      </section>
    </div>

    <!-- 笔记详情弹窗 -->
    <NoteDetailModal
      v-model:visible="showDetailModal"
      :note="selectedNote"
    />

    <!-- 删除确认弹窗 -->
    <ConfirmModal
      v-model:visible="showDeleteModal"
      title="删除笔记"
      content="确认删除吗，删除后无法恢复哦"
      confirm-text="删除"
      cancel-text="取消"
      confirm-button-type="danger"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- 上传进度弹窗 -->
    <div v-if="uploading" class="upload-overlay">
      <div class="upload-modal">
        <div class="upload-spinner"></div>
        <p>正在解析并上传...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import NoteCard from './components/NoteCard.vue'
import NoteDetailModal from './components/NoteDetailModal.vue'
import ConfirmModal from './components/ConfirmModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// 状态
const notes = ref([])
const loading = ref(false)
const uploading = ref(false)
const showDetailModal = ref(false)
const showDeleteModal = ref(false)
const selectedNote = ref(null)
const noteToDelete = ref(null)
const fileInput = ref(null)

// 计算属性：按时间分区
const todayNotes = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return notes.value.filter(note => {
    const noteDate = new Date(note.updatedAt)
    return noteDate >= today
  })
})

const weekNotes = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  return notes.value.filter(note => {
    const noteDate = new Date(note.updatedAt)
    return noteDate >= weekAgo && noteDate < today
  })
})

const olderNotes = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  return notes.value.filter(note => {
    const noteDate = new Date(note.updatedAt)
    return noteDate < weekAgo
  })
})

// 获取请求头
const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  }
  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`
  }
  return headers
}

// 获取笔记列表
const fetchNotes = async () => {
  loading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/api/notes`, {
      headers: getAuthHeaders()
    })
    
    if (response.status === 401) {
      // 未登录，打开登录弹窗
      authStore.clearAuth()
      alert('请先登录')
      router.push('/chat')
      return
    }
    
    const data = await response.json()
    if (data.success) {
      notes.value = data.notes
    }
  } catch (error) {
    console.error('获取笔记失败:', error)
  } finally {
    loading.value = false
  }
}

// 返回
const goBack = () => {
  router.push('/chat')
}

// 触发文件上传
const triggerFileUpload = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 检查文件类型
  if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
    alert('请上传 .md 或 .txt 文件')
    return
  }
  
  uploading.value = true
  
  try {
    const content = await file.text()
    
    const response = await fetch(`${API_BASE_URL}/api/notes/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        content,
        filename: file.name
      })
    })
    
    if (response.status === 401) {
      authStore.clearAuth()
      alert('请先登录')
      router.push('/chat')
      return
    }
    
    const data = await response.json()
    
    if (data.success) {
      await fetchNotes()
    } else {
      alert(data.error || '上传失败')
    }
  } catch (error) {
    console.error('上传失败:', error)
    alert('上传失败，请重试')
  } finally {
    uploading.value = false
    // 清空文件输入
    event.target.value = ''
  }
}

// 打开笔记详情
const openNoteDetail = async (note) => {
  // 调用 API 获取完整笔记内容
  try {
    const response = await fetch(`${API_BASE_URL}/api/notes/${note.id}`, {
      headers: getAuthHeaders()
    })

    if (response.status === 401) {
      authStore.clearAuth()
      alert('请先登录')
      router.push('/chat')
      return
    }

    const data = await response.json()
    if (data.success) {
      selectedNote.value = data.note
      showDetailModal.value = true
    } else {
      alert(data.error || '获取笔记详情失败')
    }
  } catch (error) {
    console.error('获取笔记详情失败:', error)
    alert('获取笔记详情失败')
  }
}

// 显示删除确认
const showDeleteConfirm = (note) => {
  noteToDelete.value = note
  showDeleteModal.value = true
}

// 确认删除
const confirmDelete = async () => {
  if (!noteToDelete.value) return
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/notes/${noteToDelete.value.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
    
    if (response.status === 401) {
      authStore.clearAuth()
      alert('请先登录')
      router.push('/chat')
      return
    }
    
    const data = await response.json()
    
    if (data.success) {
      notes.value = notes.value.filter(n => n.id !== noteToDelete.value.id)
      alert('删除成功！')
    } else {
      alert(data.error || '删除失败')
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请重试')
  } finally {
    noteToDelete.value = null
  }
}

// 取消删除
const cancelDelete = () => {
  noteToDelete.value = null
}

onMounted(() => {
  if (!authStore.isLoggedIn) {
    alert('请先登录')
    router.push('/chat')
    return
  }
  fetchNotes()
})
</script>

<style scoped>
.notes-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF8E7 0%, #FFEFC7 100%);
}

.notes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #FFE4B5;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #eee;
  color: #333;
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 140, 66, 0.4);
}

.upload-btn svg {
  width: 16px;
  height: 16px;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #ff8c42;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 18px;
  color: #666;
  margin: 0 0 8px;
}

.empty-hint {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.notes-content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.note-section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #FFE4B5;
}

.section-icon {
  font-size: 18px;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.upload-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.upload-modal {
  background: white;
  padding: 32px 48px;
  border-radius: 16px;
  text-align: center;
}

.upload-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f0f0f0;
  border-top-color: #ff8c42;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

.upload-modal p {
  color: #666;
  margin: 0;
}

@media (max-width: 640px) {
  .notes-header {
    padding: 12px 16px;
  }
  
  .page-title {
    font-size: 18px;
  }
  
  .upload-btn span {
    display: none;
  }
  
  .upload-btn {
    padding: 10px;
  }
  
  .notes-content {
    padding: 16px;
  }
  
  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
