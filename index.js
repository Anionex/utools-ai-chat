// 获取DOM元素
const chatList = document.getElementById('chat-list');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const newChatBtn = document.getElementById('new-chat-btn');
const startChatBtn = document.getElementById('start-chat-btn');
const settingsBtn = document.getElementById('settings-btn');
const modelSelect = document.getElementById('model-select');
const chatTitle = document.getElementById('chat-title');
const emptyState = document.getElementById('empty-state');
const chatContainer = document.getElementById('chat-container');

// 通知相关元素
const notification = document.getElementById('notification');
const notificationContent = notification.querySelector('.notification-content');
const notificationClose = notification.querySelector('.notification-close');

// 设置相关元素
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const modelName = document.getElementById('model-name');
const modelId = document.getElementById('model-id');
const apiUrl = document.getElementById('api-url');
const apiKey = document.getElementById('api-key');
const systemPrompt = document.getElementById('system-prompt');
const addModelBtn = document.getElementById('add-model-btn');
const modelListContainer = document.getElementById('model-list-container');

// 模型选择相关元素
const modelSelectModal = document.getElementById('model-select-modal');
const modelSelectList = document.getElementById('model-select-list');
const modelSelectInput = document.getElementById('model-select-input');

// 确认对话框相关元素
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmOk = document.getElementById('confirm-ok');
const confirmCancel = document.getElementById('confirm-cancel');
const closeConfirm = document.getElementById('close-confirm');

// 当前会话ID
let currentSessionId = null;
// 当前会话消息
let currentMessages = [];
// 模型管理器实例
const modelManager = new ModelManager();


// 初始化
function init() {
  // 加载聊天记录
  loadChatSessions();
  // 设置事件监听
  setupEventListeners();
  // 配置Markdown渲染器
  configureMarkdown();
  // 更新模型选择
  updateModelSelect();
  updateModelList();

  // 每次启动时创建新对话
  createNewChat();

  // 聚焦到输入框
  messageInput.focus();
}


// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  // 获取保存的模型配置
  const savedModelConfigs = window.preload.dbUtil.getModelConfig()
  if (savedModelConfigs && savedModelConfigs.length > 0) {
    modelManager.modelConfigs = savedModelConfigs
  }

  // 获取保存的模型索引
  const savedModelIndex = window.preload.dbUtil.getModelIndex()
  if (savedModelIndex !== undefined) {
    currentSessionId = savedModelIndex
    updateModelButtonText()
  }

  // 初始化其他UI元素
  init()
});