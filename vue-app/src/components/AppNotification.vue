<template>
  <Transition name="slide">
    <div 
      v-if="notification.isVisible" 
      class="fixed top-5 right-5 px-5 py-3 rounded shadow-lg flex items-center gap-3 z-[1000] min-w-[200px]"
      :class="typeClasses"
    >
      <span class="text-xl">{{ icon }}</span>
      <span class="flex-1">{{ notification.message }}</span>
      <button 
        @click="notification.hide()" 
        class="bg-transparent border-none text-white cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
      >
        &times;
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '@/stores/notificationStore'

const notification = useNotificationStore()

const icon = computed(() => {
  switch (notification.type) {
    case 'success': return '✓'
    case 'error': return '✕'
    case 'warning': return '⚠'
    default: return 'ℹ'
  }
})

const typeClasses = computed(() => {
  switch (notification.type) {
    case 'success': return 'bg-success text-white'
    case 'error': return 'bg-error text-white'
    case 'warning': return 'bg-warning text-white'
    default: return 'bg-dark-900 text-white'
  }
})
</script>


