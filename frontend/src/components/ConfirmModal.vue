<template>
  <div class="modal-overlay" v-if="visible" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <div class="modal-icon" v-if="icon">{{ icon }}</div>
        <h3 class="modal-title">{{ title }}</h3>
      </div>
      <div class="modal-body" v-if="content">
        <p class="modal-content">{{ content }}</p>
      </div>
      <div class="modal-footer">
        <button 
          class="modal-btn cancel" 
          @click="handleCancel"
          v-if="showCancel"
        >
          {{ cancelText }}
        </button>
        <button 
          class="modal-btn" 
          :class="confirmButtonClass"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </button>
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
  title: {
    type: String,
    default: '提示'
  },
  content: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  confirmButtonType: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'danger', 'warning'].includes(value)
  },
  closeOnOverlay: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['confirm', 'cancel', 'update:visible'])

const confirmButtonClass = {
  'confirm-primary': props.confirmButtonType === 'primary',
  'confirm-danger': props.confirmButtonType === 'danger',
  'confirm-warning': props.confirmButtonType === 'warning'
}

const handleConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    handleCancel()
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: linear-gradient(135deg, #FFFEF5 0%, #FFF8E7 100%);
  border-radius: 20px;
  border: 2px solid #FFD89B;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 360px;
  padding: 24px;
  animation: slideUp 0.3s ease;
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

.modal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}

.modal-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #2D2D2D;
  margin: 0;
}

.modal-body {
  text-align: center;
  margin-bottom: 24px;
}

.modal-content {
  font-size: 14px;
  color: #5A5A5A;
  line-height: 1.6;
  margin: 0;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  min-width: 100px;
}

.modal-btn.cancel {
  background: rgba(255, 255, 255, 0.8);
  color: #5A5A5A;
  border: 1px solid #FFD89B;
}

.modal-btn.cancel:hover {
  background: white;
  color: #2D2D2D;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Primary - 主题色 */
.modal-btn.confirm-primary {
  background: linear-gradient(135deg, #FFB347 0%, #FF9F1C 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 179, 71, 0.3);
}

.modal-btn.confirm-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 179, 71, 0.4);
}

/* Danger - 红色 */
.modal-btn.confirm-danger {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.modal-btn.confirm-danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

/* Warning - 橙色 */
.modal-btn.confirm-warning {
  background: linear-gradient(135deg, #FFA726 0%, #FF9800 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 167, 38, 0.3);
}

.modal-btn.confirm-warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 167, 38, 0.4);
}
</style>
