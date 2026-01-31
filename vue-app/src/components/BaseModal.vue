<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="modelValue" 
        class="fixed inset-0 bg-black/50 z-[1000] flex justify-center items-center"
        @click.self="closeOnBackdrop && $emit('update:modelValue', false)"
      >
        <Transition name="scale">
          <div 
            v-if="modelValue"
            class="bg-white rounded-lg w-full max-h-[80vh] overflow-y-auto shadow-xl"
            :class="[sizeClasses]"
          >
            <!-- Header -->
            <div class="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-800">{{ title }}</h3>
              <button 
                @click="$emit('update:modelValue', false)"
                class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                title="关闭"
              >
                <X :size="18" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-5">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="p-5 border-t border-gray-200 flex justify-end gap-3">
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true
  }
})

defineEmits(['update:modelValue'])

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'max-w-sm mx-4'
    case 'lg': return 'max-w-2xl mx-4'
    default: return 'max-w-lg mx-4'
  }
})

// ESC 键关闭
function handleKeydown(e) {
  if (e.key === 'Escape' && props.modelValue) {
    // 使用自定义事件通知父组件
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>


