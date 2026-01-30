<template>
  <li 
    class="px-4 py-3 cursor-pointer border-b border-dark-700 transition-colors flex justify-between items-center hover:bg-dark-800 group"
    :class="{ 'bg-dark-700 border-l-[3px] border-l-dark-200': isActive }"
    @click="$emit('select')"
  >
    <div class="flex-1 overflow-hidden">
      <div class="font-medium mb-1 truncate text-dark-50">{{ title }}</div>
      <div class="text-xs text-dark-300 truncate">{{ preview }}</div>
    </div>
    <div 
      class="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center text-dark-400 hover:text-error"
      @click.stop="$emit('delete')"
      title="删除对话"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    </div>
  </li>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  session: {
    type: Object,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  }
})

defineEmits(['select', 'delete'])

const title = computed(() => {
  if (props.session.messages && props.session.messages[1]) {
    return props.session.messages[1].content.substring(0, 35) || '新对话'
  }
  return '新对话'
})

const preview = computed(() => {
  if (!props.session.messages || props.session.messages.length === 0) {
    return ''
  }
  const lastMessage = props.session.messages[props.session.messages.length - 1]
  const prefix = lastMessage.role === 'user' ? '你: ' : 'AI: '
  return prefix + lastMessage.content.substring(0, 30)
})
</script>


