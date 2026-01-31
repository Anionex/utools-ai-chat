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
        class="px-4 py-3 cursor-pointer border-b-2 transition-all flex items-center gap-2"
        :class="activeTab === 'models' ? 'border-primary text-primary font-medium' : 'border-transparent text-gray-600 hover:bg-gray-50'"
        @click="activeTab = 'models'"
      >
        <Bot :size="16" />
        <span>模型设置</span>
      </div>
      <div 
        class="px-4 py-3 cursor-pointer border-b-2 transition-all flex items-center gap-2"
        :class="activeTab === 'commands' ? 'border-primary text-primary font-medium' : 'border-transparent text-gray-600 hover:bg-gray-50'"
        @click="activeTab = 'commands'"
      >
        <Terminal :size="16" />
        <span>指令设置</span>
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
        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all hover:scale-105 flex items-center gap-2"
      >
        <Save v-if="editingModelIndex !== null" :size="16" />
        <Plus v-else :size="16" />
        <span>{{ editingModelIndex !== null ? '更新模型' : '添加模型' }}</span>
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
          class="flex items-center justify-between p-3 border border-gray-200 rounded-lg mb-2 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-800 mb-1">{{ config.name }}</div>
            <div class="text-xs text-gray-500 truncate">{{ config.url }} ({{ config.model }})</div>
            <div class="text-xs text-gray-400 truncate">系统提示词: {{ config.systemPrompt || '无' }}</div>
          </div>
          <div class="flex gap-2 ml-3">
            <button 
              @click="handleEditModel(index)"
              class="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="编辑模型"
            >
              <Pencil :size="16" />
            </button>
            <button 
              @click="handleDeleteModel(index)"
              class="p-2 text-gray-600 hover:bg-red-100 hover:text-red-500 rounded-lg transition-colors"
              title="删除模型"
            >
              <Trash2 :size="16" />
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
        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all hover:scale-105 flex items-center gap-2"
      >
        <Save v-if="editingCommandId" :size="16" />
        <Plus v-else :size="16" />
        <span>{{ editingCommandId ? '更新指令' : '添加指令' }}</span>
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
              class="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="编辑指令"
            >
              <Pencil :size="16" />
            </button>
            <button 
              @click="handleDeleteCommand(command)"
              class="p-2 text-gray-600 hover:bg-red-100 hover:text-red-500 rounded-lg transition-colors"
              title="删除指令"
            >
              <Trash2 :size="16" />
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
import { Plus, Save, Pencil, Trash2, Bot, Terminal } from 'lucide-vue-next'
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


