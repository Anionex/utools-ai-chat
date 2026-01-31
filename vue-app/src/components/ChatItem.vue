<template>
  <li 
    class="mx-2 my-1 px-3 py-2.5 cursor-pointer rounded-xl transition-colors flex justify-between items-center hover:bg-dark-800 group"
    :class="{ 'bg-dark-800 ring-1 ring-dark-600': isActive }"
    @click="$emit('select')"
  >
    <div class="flex-1 overflow-hidden min-w-0">
      <div class="font-medium mb-0.5 truncate text-dark-200">{{ title }}</div>
      <div class="text-xs text-dark-500 truncate">{{ preview }}</div>
    </div>
    <div 
      class="w-7 h-7 shrink-0 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center justify-center text-dark-500 hover:text-error rounded-lg hover:bg-dark-700 ml-2"
      @click.stop="$emit('delete')"
      title="删除对话"
    >
      <Trash2 :size="14" />
    </div>
  </li>
</template>

<script setup>
import { computed } from 'vue'
import { Trash2 } from 'lucide-vue-next'

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


