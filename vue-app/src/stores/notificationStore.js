import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  // 状态
  const isVisible = ref(false)
  const message = ref('')
  const type = ref('info') // info, success, error, warning
  let timeoutId = null

  // 显示通知
  function show(msg, notificationType = 'info', duration = 3000) {
    // 清除之前的定时器
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    message.value = msg
    type.value = notificationType
    isVisible.value = true

    // 设置自动关闭
    timeoutId = setTimeout(() => {
      hide()
    }, duration)
  }

  // 隐藏通知
  function hide() {
    isVisible.value = false
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  // 快捷方法
  function success(msg, duration = 3000) {
    show(msg, 'success', duration)
  }

  function error(msg, duration = 3000) {
    show(msg, 'error', duration)
  }

  function warning(msg, duration = 3000) {
    show(msg, 'warning', duration)
  }

  function info(msg, duration = 3000) {
    show(msg, 'info', duration)
  }

  return {
    // 状态
    isVisible,
    message,
    type,
    // 方法
    show,
    hide,
    success,
    error,
    warning,
    info
  }
})


