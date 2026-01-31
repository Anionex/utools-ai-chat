<template>
  <BaseModal 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)"
    title="快捷键"
    size="md"
  >
    <div class="space-y-2">
      <div 
        v-for="shortcut in shortcuts" 
        :key="shortcut.keys"
        class="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center gap-3">
          <component :is="shortcut.icon" :size="16" class="text-primary" />
          <span class="text-gray-700">{{ shortcut.description }}</span>
        </div>
        <div class="flex items-center gap-1">
          <kbd 
            v-for="(key, index) in shortcut.keys.split('+')" 
            :key="index"
            class="inline-block px-2 py-1 font-mono text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded"
          >
            {{ key.trim() }}
          </kbd>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { MessageSquarePlus, RefreshCw, Bot, Send, CornerDownLeft } from 'lucide-vue-next'
import BaseModal from './BaseModal.vue'

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])

const shortcuts = [
  { keys: 'Ctrl + N', description: '新建对话', icon: MessageSquarePlus },
  { keys: 'Ctrl + Shift + M', description: '切换到下一个模型', icon: RefreshCw },
  { keys: 'Ctrl + Alt + T', description: '打开模型选择器', icon: Bot },
  { keys: 'Enter', description: '发送消息', icon: Send },
  { keys: 'Shift + Enter', description: '换行', icon: CornerDownLeft }
]
</script>


