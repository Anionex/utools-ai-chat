<template>
  <BaseModal 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)"
    title="设置"
    size="lg"
  >
    <!-- 标签页 -->
    <div class="flex border-b border-gray-200 mb-5">
      <div 
        class="px-4 py-3 cursor-pointer border-b-2 transition-all"
        :class="activeTab === 'models' ? 'border-primary text-primary font-medium' : 'border-transparent text-gray-600 hover:bg-gray-50'"
        @click="activeTab = 'models'"
      >
        模型设置
      </div>
      <div 
        class="px-4 py-3 cursor-pointer border-b-2 transition-all"
        :class="activeTab === 'commands' ? 'border-primary text-primary font-medium' : 'border-transparent text-gray-600 hover:bg-gray-50'"
        @click="activeTab = 'commands'"
      >
        指令设置
      </div>
    </div>

    <!-- 模型设置标签页 -->
    <div v-show="activeTab === 'models'">
      <!-- 表单 -->
      <div class="space-y-4 mb-4">
        <div>
          <label class="block mb-1 font-medium text-gray-700">模型名称</label>
          <input 
            v-model="modelForm.name"
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
            placeholder="例如: GPT-3.5"
          />
        </div>
        <div>
          <label class="block mb-1 font-medium text-gray-700">模型ID</label>
          <input 
            v-model="modelForm.model"
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
            placeholder="例如: gpt-3.5-turbo"
          />
        </div>
        <div>
          <label class="block mb-1 font-medium text-gray-700">API地址</label>
          <input 
            v-model="modelForm.url"
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
            placeholder="例如: https://api.openai.com/v1/chat/completions"
          />
        </div>
        <div>
          <label class="block mb-1 font-medium text-gray-700">API密钥</label>
          <input 
            v-model="modelForm.key"
            type="password" 
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
            placeholder="输入您的API密钥"
          />
        </div>
        <div>
          <label class="block mb-1 font-medium text-gray-700">系统提示词</label>
          <textarea 
            v-model="modelForm.systemPrompt"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary min-h-[80px] resize-y"
            placeholder="输入系统提示词，定义AI助手的行为和特性"
          ></textarea>
        </div>
      </div>

      <button 
        @click="handleAddOrUpdateModel"
        class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
      >
        {{ editingModelIndex !== null ? '更新模型' : '添加模型' }}
      </button>

      <!-- 模型列表 -->
      <div class="mt-5 pt-4 border-t border-gray-200">
        <h4 class="font-medium text-gray-700 mb-3">已添加的模型</h4>
        <div v-if="modelStore.modelConfigs.length === 0" class="text-gray-500">
          暂无模型，请添加
        </div>
        <div 
          v-for="(config, index) in modelStore.modelConfigs" 
          :key="index"
          class="flex justify-between items-center p-3 border-b border-gray-100 last:border-b-0"
        >
          <div class="flex-1">
            <div class="font-medium text-gray-800">{{ config.name }}</div>
            <div class="text-xs text-gray-500">{{ config.url }} ({{ config.model }})</div>
            <div class="text-xs text-gray-500">系统提示词: {{ config.systemPrompt || '无' }}</div>
          </div>
          <div class="flex gap-2">
            <button 
              @click="handleEditModel(index)"
              class="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-hover transition-colors"
            >
              编辑
            </button>
            <button 
              @click="handleDeleteModel(index)"
              class="px-3 py-1 bg-dark-600 text-white text-sm rounded hover:bg-dark-700 transition-colors"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 指令设置标签页 -->
    <div v-show="activeTab === 'commands'">
      <!-- 表单 -->
      <div class="space-y-4 mb-4">
        <div>
          <label class="block mb-1 font-medium text-gray-700">指令名称</label>
          <input 
            v-model="commandForm.name"
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
            placeholder="例如: AI总结"
          />
        </div>
        <div>
          <label class="block mb-1 font-medium text-gray-700">指令代码</label>
          <input 
            v-model="commandForm.code"
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
            placeholder="例如: ai-summary"
          />
        </div>
        <div>
          <label class="block mb-1 font-medium text-gray-700">指令描述</label>
          <input 
            v-model="commandForm.description"
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary"
            placeholder="例如: AI总结文本内容"
          />
        </div>
        <div>
          <label class="block mb-1 font-medium text-gray-700">系统提示词</label>
          <textarea 
            v-model="commandForm.systemPrompt"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary min-h-[80px] resize-y"
            placeholder="输入系统提示词，定义AI指令的行为"
          ></textarea>
        </div>
        <div class="text-sm text-gray-500 bg-gray-100 p-3 rounded">
          创建指令后，可以通过选中文本并呼出uTools使用您的自定义指令
        </div>
      </div>

      <button 
        @click="handleAddOrUpdateCommand"
        class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-hover transition-colors"
      >
        {{ editingCommandId ? '更新指令' : '添加指令' }}
      </button>

      <!-- 指令列表 -->
      <div class="mt-5 pt-4 border-t border-gray-200">
        <h4 class="font-medium text-gray-700 mb-3">自定义指令列表</h4>
        <div v-if="commandStore.customCommands.length === 0" class="text-gray-500">
          还没有自定义指令，添加一个吧！
        </div>
        <div 
          v-for="command in commandStore.customCommands" 
          :key="command.id"
          class="flex items-center justify-between p-3 border border-gray-200 rounded mb-2 bg-gray-50"
        >
          <div class="flex-1">
            <div class="font-medium text-gray-800 mb-1">{{ command.name }}</div>
            <div class="text-xs text-gray-500 mb-1">{{ command.description || '' }}</div>
            <div class="text-xs text-gray-400 font-mono">代码: {{ command.code }}</div>
          </div>
          <div class="flex gap-2">
            <button 
              @click="handleEditCommand(command)"
              class="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="编辑指令"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button 
              @click="handleDeleteCommand(command)"
              class="p-2 text-gray-600 hover:bg-red-100 hover:text-red-500 rounded transition-colors"
              title="删除指令"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>

  <!-- 确认删除弹窗 -->
  <ConfirmModal
    v-model="showDeleteConfirm"
    title="确认删除"
    :message="deleteConfirmMessage"
    @confirm="confirmDelete"
  />
</template>

<script setup>
import { ref, reactive } from 'vue'
import BaseModal from './BaseModal.vue'
import ConfirmModal from './ConfirmModal.vue'
import { useModelStore } from '@/stores/modelStore'
import { useCommandStore } from '@/stores/commandStore'
import { useNotificationStore } from '@/stores/notificationStore'

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])

const modelStore = useModelStore()
const commandStore = useCommandStore()
const notification = useNotificationStore()

const activeTab = ref('models')

// 模型表单
const modelForm = reactive({
  name: '',
  model: '',
  url: '',
  key: '',
  systemPrompt: ''
})
const editingModelIndex = ref(null)

// 指令表单
const commandForm = reactive({
  name: '',
  code: '',
  description: '',
  systemPrompt: ''
})
const editingCommandId = ref(null)

// 删除确认
const showDeleteConfirm = ref(false)
const deleteConfirmMessage = ref('')
const deleteTarget = ref(null)
const deleteType = ref('')

// 模型操作
function handleAddOrUpdateModel() {
  try {
    if (editingModelIndex.value !== null) {
      modelStore.updateModel(editingModelIndex.value, { ...modelForm })
      notification.success('模型已更新')
    } else {
      modelStore.addModel({ ...modelForm })
      notification.success('模型已添加')
    }
    resetModelForm()
  } catch (error) {
    notification.error(error.message)
  }
}

function handleEditModel(index) {
  const config = modelStore.modelConfigs[index]
  modelForm.name = config.name
  modelForm.model = config.model
  modelForm.url = config.url
  modelForm.key = config.key
  modelForm.systemPrompt = config.systemPrompt
  editingModelIndex.value = index
}

function handleDeleteModel(index) {
  deleteTarget.value = index
  deleteType.value = 'model'
  deleteConfirmMessage.value = '确定要删除这个模型吗？'
  showDeleteConfirm.value = true
}

function resetModelForm() {
  modelForm.name = ''
  modelForm.model = ''
  modelForm.url = ''
  modelForm.key = ''
  modelForm.systemPrompt = ''
  editingModelIndex.value = null
}

// 指令操作
function handleAddOrUpdateCommand() {
  if (!commandForm.name || !commandForm.code || !commandForm.systemPrompt) {
    notification.error('请填写所有必填字段')
    return
  }

  try {
    const command = {
      code: commandForm.code,
      name: commandForm.name,
      description: commandForm.description || commandForm.name,
      systemPrompt: commandForm.systemPrompt
    }

    if (editingCommandId.value) {
      commandStore.updateCommand(editingCommandId.value, command)
      notification.success('指令已更新')
    } else {
      commandStore.addCommand(command)
      notification.success('指令已添加')
    }
    resetCommandForm()
  } catch (error) {
    notification.error(error.message)
  }
}

function handleEditCommand(command) {
  commandForm.name = command.name
  commandForm.code = command.code
  commandForm.description = command.description
  commandForm.systemPrompt = command.systemPrompt
  editingCommandId.value = command.id
}

function handleDeleteCommand(command) {
  deleteTarget.value = command
  deleteType.value = 'command'
  deleteConfirmMessage.value = `确定要删除指令 "${command.name}" 吗？`
  showDeleteConfirm.value = true
}

function resetCommandForm() {
  commandForm.name = ''
  commandForm.code = ''
  commandForm.description = ''
  commandForm.systemPrompt = ''
  editingCommandId.value = null
}

// 确认删除
function confirmDelete() {
  try {
    if (deleteType.value === 'model') {
      modelStore.deleteModel(deleteTarget.value)
      notification.success('模型已删除')
      resetModelForm()
    } else if (deleteType.value === 'command') {
      commandStore.deleteCommand(deleteTarget.value.code)
      notification.success('指令已删除')
      resetCommandForm()
    }
  } catch (error) {
    notification.error(error.message)
  }
}
</script>


