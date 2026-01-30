<template>
  <Teleport to="body">
    <Transition name="fade">
      <div 
        v-if="modelValue" 
        class="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center"
        @click.self="$emit('update:modelValue', false)"
      >
        <Transition name="scale">
          <div 
            v-if="modelValue"
            class="bg-white rounded-lg w-4/5 max-w-[600px] shadow-xl overflow-hidden"
          >
            <!-- Header -->
            <div class="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 class="text-lg font-medium">
                编辑{{ messageRole === 'user' ? '用户' : 'AI' }}消息
              </h3>
              <button 
                @click="$emit('update:modelValue', false)"
                class="bg-transparent border-none text-2xl cursor-pointer text-gray-400 hover:text-gray-600 leading-none"
              >
                &times;
              </button>
            </div>

            <!-- Content -->
            <textarea
              ref="textareaRef"
              v-model="editContent"
              class="w-full min-h-[150px] p-4 border-none resize-y outline-none font-sans text-sm leading-relaxed"
              @keydown.esc="$emit('update:modelValue', false)"
            ></textarea>

            <!-- Footer -->
            <div class="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button 
                @click="$emit('update:modelValue', false)"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button 
                @click="handleSave"
                class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  content: {
    type: String,
    default: ''
  },
  messageRole: {
    type: String,
    default: 'user'
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const textareaRef = ref(null)
const editContent = ref('')

// 当弹窗打开时，同步内容并聚焦
watch(() => props.modelValue, (val) => {
  if (val) {
    editContent.value = props.content
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.focus()
        textareaRef.value.setSelectionRange(
          textareaRef.value.value.length, 
          textareaRef.value.value.length
        )
      }
    })
  }
})

function handleSave() {
  if (editContent.value.trim() === '') {
    return
  }
  emit('save', editContent.value.trim())
  emit('update:modelValue', false)
}
</script>


