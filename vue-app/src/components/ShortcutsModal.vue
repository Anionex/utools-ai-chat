<template>
  <BaseModal 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)"
    title="快捷键"
    size="md"
  >
    <div class="space-y-4">
      <div 
        v-for="shortcut in shortcuts" 
        :key="shortcut.keys"
        class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
      >
        <div class="flex items-center gap-2">
          <kbd 
            v-for="(key, index) in shortcut.keys.split('+')" 
            :key="index"
            class="inline-block px-2 py-1 font-mono text-xs text-gray-700 bg-gray-100 border border-gray-300 rounded shadow-sm"
          >
            {{ key.trim() }}
          </kbd>
        </div>
        <span class="text-gray-600">{{ shortcut.description }}</span>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])

const shortcuts = [
  { keys: 'Ctrl + N', description: '新建对话' },
  { keys: 'Ctrl + Shift + M', description: '切换到下一个模型' },
  { keys: 'Ctrl + Alt + T', description: '打开模型选择器' },
  { keys: 'Enter', description: '发送消息' },
  { keys: 'Shift + Enter', description: '换行' }
]
</script>


