<template>
  <div v-if="visible" class="note-modal-overlay" @click="handleOverlayClick">
    <div class="note-modal" @click.stop>
      <button class="close-btn" @click="close">×</button>
      
      <div class="note-header">
        <h2 class="note-title">{{ note?.noteType || '笔记详情' }}</h2>
        <div class="note-meta">
          <span class="note-date" v-if="note?.noteDate">
            📅 {{ formatDate(note.noteDate) }}
          </span>
          <span class="note-updated" v-if="note?.updatedAt">
            📝 更新于 {{ formatDate(note.updatedAt) }}
          </span>
        </div>
      </div>

      <div class="note-content">
        <pre>{{ note?.content }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  note: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible'])

const close = () => {
  emit('update:visible', false)
}

const handleOverlayClick = () => {
  close()
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
</script>

<style scoped>
.note-modal-overlay {
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

.note-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
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
  z-index: 10;
}

.close-btn:hover {
  background: #eee;
  color: #333;
}

.note-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #eee;
}

.note-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
  line-height: 1.4;
}

.note-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.note-date,
.note-updated {
  font-size: 13px;
  color: #999;
}

.note-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.note-content pre {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

@media (max-width: 640px) {
  .note-modal {
    width: 95%;
    max-height: 85vh;
  }
  
  .note-header {
    padding: 20px 20px 12px;
  }
  
  .note-title {
    font-size: 18px;
  }
  
  .note-content {
    padding: 16px 20px;
  }
}
</style>
