<template>
  <div class="flex h-screen overflow-hidden">
    <!-- 侧边栏 -->
    <ChatList
      :sessions="chatStore.sessions"
      :current-session-id="chatStore.currentSessionId"
      @new-chat="handleNewChat"
      @select-session="handleSelectSession"
      @delete-session="handleDeleteSession"
      @open-settings="showSettings = true"
      @open-shortcuts="showShortcuts = true"
    />

    <!-- 主内容区 -->
    <EmptyState 
      v-if="!chatStore.currentSessionId"
      @start-chat="handleNewChat"
    />
    <ChatContainer
      v-else
      ref="chatContainerRef"
      :title="chatStore.chatTitle"
      :messages="chatStore.currentMessages"
      :models="modelStore.modelConfigs"
      :current-model-index="modelStore.currentModelIndex"
      :has-models="modelStore.hasModels"
      :is-generating="chatStore.isGenerating"
      :retrying-index="retryingIndex"
      @model-change="handleModelChange"
      @send="handleSend"
      @stop="handleStop"
      @edit-message="handleEditMessage"
      @delete-message="handleDeleteMessage"
      @retry-message="handleRetryMessage"
    />

    <!-- 通知组件 -->
    <AppNotification />

    <!-- 模态框 -->
    <SettingsModal v-model="showSettings" />
    <ShortcutsModal v-model="showShortcuts" />
    <ModelSelectModal 
      v-model="showModelSelect"
      :models="modelStore.modelConfigs"
      :current-index="modelStore.currentModelIndex"
      @select="handleModelSelect"
    />
    <EditMessageModal
      v-model="showEditMessage"
      :content="editingMessage?.content || ''"
      :message-role="editingMessage?.role || 'user'"
      @save="handleSaveEditMessage"
    />
    <ConfirmModal
      v-model="showDeleteConfirm"
      title="确认删除"
      :message="deleteConfirmMessage"
      @confirm="confirmDeleteMessage"
    />
    <ConfirmModal
      v-model="showRegenerateConfirm"
      title="重新生成"
      message="是否需要根据修改后的消息重新生成AI回复？"
      @confirm="confirmRegenerate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import ChatList from '@/components/ChatList.vue'
import ChatContainer from '@/components/ChatContainer.vue'
import EmptyState from '@/components/EmptyState.vue'
import AppNotification from '@/components/AppNotification.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import ShortcutsModal from '@/components/ShortcutsModal.vue'
import ModelSelectModal from '@/components/ModelSelectModal.vue'
import EditMessageModal from '@/components/EditMessageModal.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'

import { useChatStore } from '@/stores/chatStore'
import { useModelStore } from '@/stores/modelStore'
import { useCommandStore } from '@/stores/commandStore'
import { useNotificationStore } from '@/stores/notificationStore'

const chatStore = useChatStore()
const modelStore = useModelStore()
const commandStore = useCommandStore()
const notification = useNotificationStore()

// Refs
const chatContainerRef = ref(null)

// 弹窗状态
const showSettings = ref(false)
const showShortcuts = ref(false)
const showModelSelect = ref(false)
const showEditMessage = ref(false)
const showDeleteConfirm = ref(false)
const showRegenerateConfirm = ref(false)

// 编辑消息
const editingMessage = ref(null)
const editingMessageIndex = ref(-1)

// 删除消息
const deleteConfirmMessage = ref('')
const deletingMessageIndex = ref(-1)

// 重试
const retryingIndex = ref(-1)

// 重新生成确认
const regenerateMessageIndex = ref(-1)

// 初始化
onMounted(() => {
  // 加载数据
  modelStore.loadModelConfigs()
  chatStore.loadChatSessions()
  commandStore.loadCommands()

  // 创建新对话
  handleNewChat()

  // 聚焦到输入框
  nextTick(() => {
    chatContainerRef.value?.focus()
  })

  // 设置键盘事件监听
  document.addEventListener('keydown', handleGlobalKeydown)

  // 设置 uTools 特性触发回调
  if (window.preload) {
    window.preload.commandManager.onFeatureTriggered(handleFeatureTriggered)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

// 全局键盘事件处理
function handleGlobalKeydown(e) {
  // Ctrl+Alt+T 打开模型选择器
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
    e.preventDefault()
    if (modelStore.hasModels) {
      showModelSelect.value = true
    } else {
      notification.warning('请先添加模型配置')
    }
  }

  // Ctrl+N 新建对话
  if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'n') {
    e.preventDefault()
    handleNewChat()
  }

  // Ctrl+Shift+M 切换到下一个模型
  if (e.ctrlKey && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'm') {
    e.preventDefault()
    handleSwitchNextModel()
  }
}

// 处理 uTools 特性触发
async function handleFeatureTriggered(detail) {
  const { sessionId, modelConfig, systemPrompt, userMessage } = detail

  // 加载会话
  chatStore.loadChatSession(sessionId)

  // 准备消息
  const aiMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ]

  // 添加 AI 回复占位
  const aiMessage = {
    role: 'assistant',
    content: '',
    timestamp: Date.now()
  }
  chatStore.currentMessages.push(aiMessage)

  try {
    chatStore.isGenerating = true

    // 调用 AI API
    if (window.preload) {
      await window.preload.aiUtil.callAI(modelConfig, aiMessages, (content) => {
        aiMessage.content = content
      })
    }

    // 保存
    if (window.preload) {
      window.preload.dbUtil.saveChatHistory(
        chatStore.currentSessionId,
        chatStore.currentMessages,
        Date.now()
      )
    }

    chatStore.loadChatSessions()
  } catch (error) {
    chatStore.currentMessages.pop()
    chatStore.currentMessages.push({
      role: 'assistant',
      content: `发生错误: ${error.message}`,
      timestamp: Date.now()
    })
    notification.error(error.message)
  } finally {
    chatStore.isGenerating = false
  }
}

// 新建对话
function handleNewChat() {
  const systemPrompt = modelStore.currentModel?.systemPrompt || ''
  chatStore.createNewChat(systemPrompt)
  nextTick(() => {
    chatContainerRef.value?.focus()
  })
}

// 选择会话
function handleSelectSession(sessionId) {
  chatStore.loadChatSession(sessionId)
  nextTick(() => {
    chatContainerRef.value?.focus()
  })
}

// 删除会话
function handleDeleteSession(sessionId) {
  chatStore.deleteChatSession(sessionId)
  notification.success('对话已删除')
}

// 模型变更
function handleModelChange(index) {
  try {
    modelStore.setCurrentModel(index)
    // 如果当前会话只有系统消息，更新系统提示词
    if (chatStore.currentSessionId && chatStore.currentMessages.length <= 1) {
      chatStore.updateSystemPrompt(modelStore.currentModel?.systemPrompt || '')
    }
  } catch (error) {
    notification.error(error.message)
  }
}

// 模型选择
function handleModelSelect(index) {
  handleModelChange(index)
  notification.success(`已切换到模型: ${modelStore.currentModel?.name}`)
}

// 切换下一个模型
function handleSwitchNextModel() {
  try {
    const model = modelStore.switchToNextModel()
    // 如果当前会话只有系统消息，更新系统提示词
    if (chatStore.currentSessionId && chatStore.currentMessages.length <= 1) {
      chatStore.updateSystemPrompt(model.systemPrompt || '')
    }
    notification.success(`已切换到模型: ${model.name}`)
  } catch (error) {
    notification.warning(error.message)
  }
}

// 发送消息
async function handleSend(content) {
  if (!modelStore.currentModel) {
    notification.warning('请先添加模型配置')
    return
  }

  try {
    await chatStore.sendMessage(content, modelStore.currentModel)
  } catch (error) {
    notification.error(error.message)
  }
}

// 停止生成
function handleStop() {
  chatStore.abortCurrentResponse()
}

// 编辑消息
function handleEditMessage(index) {
  editingMessage.value = chatStore.currentMessages[index]
  editingMessageIndex.value = index
  showEditMessage.value = true
}

// 保存编辑的消息
function handleSaveEditMessage(newContent) {
  const index = editingMessageIndex.value
  const message = chatStore.currentMessages[index]
  
  chatStore.editMessage(index, newContent)
  notification.success('消息已更新')

  // 如果编辑的是用户消息，询问是否重新生成 AI 回复
  if (message.role === 'user' && 
      index + 1 < chatStore.currentMessages.length && 
      chatStore.currentMessages[index + 1].role === 'assistant') {
    regenerateMessageIndex.value = index + 1
    showRegenerateConfirm.value = true
  }

  editingMessage.value = null
  editingMessageIndex.value = -1
}

// 确认重新生成
function confirmRegenerate() {
  handleRetryMessage(regenerateMessageIndex.value)
  regenerateMessageIndex.value = -1
}

// 删除消息
function handleDeleteMessage(index) {
  deletingMessageIndex.value = index
  deleteConfirmMessage.value = '确定要删除这条消息吗？'
  showDeleteConfirm.value = true
}

// 确认删除消息
function confirmDeleteMessage() {
  try {
    chatStore.deleteMessage(deletingMessageIndex.value)
    notification.success('消息已删除')

    // 检查是否还有消息
    if (chatStore.currentMessages.length === 0) {
      // 可以选择删除整个会话
    }
  } catch (error) {
    notification.error(error.message)
  }
  deletingMessageIndex.value = -1
}

// 重试消息
async function handleRetryMessage(index) {
  if (!modelStore.currentModel) {
    notification.warning('请先添加模型配置')
    return
  }

  try {
    retryingIndex.value = index
    await chatStore.retryMessage(index, modelStore.currentModel)
  } catch (error) {
    notification.error(error.message)
  } finally {
    retryingIndex.value = -1
  }
}
</script>


