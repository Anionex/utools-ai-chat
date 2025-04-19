// 加载聊天记录
function loadChatSessions() {
    const sessions = window.preload.dbUtil.getAllSessions();

    chatList.innerHTML = '';

    if (sessions.length === 0) {
        return;
    }

    sessions.forEach(session => {
        addChatItemToList(session);
    });
}

// 添加聊天项到列表
function addChatItemToList(session) {
    const chatItem = document.createElement('li');
    chatItem.className = 'chat-item';
    chatItem.dataset.id = session.id;

    if (currentSessionId === session.id) {
        chatItem.classList.add('active');
    }

    const lastMessage = session.messages[session.messages.length - 1];
    const title = session.messages[0]?.content.substring(0, 20) || '新对话';
    const preview = lastMessage ? `${lastMessage.role === 'user' ? '你: ' : 'AI: '}${lastMessage.content.substring(0, 30)}` : '';

    chatItem.innerHTML = `
      <div class="chat-item-content">
        <div class="chat-item-title">${title}</div>
        <div class="chat-item-preview">${preview}</div>
      </div>
      <div class="chat-item-delete" title="删除对话">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </div>
    `;

    chatItem.addEventListener('click', (e) => {
        // 如果点击的是删除按钮，不触发加载对话
        if (e.target.closest('.chat-item-delete')) {
            e.stopPropagation();
            deleteChatSession(session.id);
            return;
        }
        loadChatSession(session.id);
    });

    chatList.appendChild(chatItem);
}

// 加载聊天会话
function loadChatSession(sessionId) {
    currentSessionId = sessionId;
    currentMessages = window.preload.dbUtil.getChatHistory(sessionId) || [];

    // 更新UI
    updateChatUI();

    // 更新活动状态
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.id === sessionId) {
            item.classList.add('active');
        }
    });

    // 聚焦到输入框
    messageInput.focus();
}

// 更新聊天UI
function updateChatUI() {
    if (currentSessionId === null) {
        emptyState.style.display = 'flex';
        chatContainer.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    chatContainer.style.display = 'flex';

    // 更新标题
    if (currentMessages.length > 0) {
        chatTitle.textContent = currentMessages[0].content.substring(0, 20);
    } else {
        chatTitle.textContent = '新对话';
    }

    // 更新消息列表
    renderMessages();
}

// 渲染消息
function renderMessages() {
    chatMessages.innerHTML = '';

    currentMessages.forEach(msg => {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${msg.role === 'user' ? 'user' : 'ai'}`;

        const messageContent = document.createElement('div');

        // 使用Markdown渲染AI消息
        if (msg.role === 'assistant') {
            messageContent.className = 'markdown-content';
            messageContent.innerHTML = marked.parse(msg.content);
            // 高亮代码块
            messageEl.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } else {
            messageContent.textContent = msg.content;
        }

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = formatTime(msg.timestamp);

        messageEl.appendChild(messageContent);
        messageEl.appendChild(messageTime);

        chatMessages.appendChild(messageEl);
    });

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// 创建新会话
function createNewChat() {
    currentSessionId = Date.now().toString();
    currentMessages = [];

    // 更新UI
    updateChatUI();

    // 添加到列表
    const session = {
        id: currentSessionId,
        messages: currentMessages,
        lastTime: Date.now()
    };

    addChatItemToList(session);

    // 保存到数据库
    window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages);

    // 聚焦到输入框
    messageInput.focus();
}


// 删除聊天会话
function deleteChatSession(sessionId) {
    // 从数据库中删除
    window.preload.dbUtil.deleteChatHistory(sessionId);

    // 如果删除的是当前会话，清空当前会话
    if (currentSessionId === sessionId) {
        currentSessionId = null;
        currentMessages = [];
        updateChatUI();
    }

    // 重新加载聊天列表
    loadChatSessions();

    // 显示删除成功通知
    showNotification('对话已删除', 'success');
}


// 发送消息
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // 如果没有当前会话，创建一个新会话
    if (currentSessionId === null) {
        createNewChat();
    }

    // 添加用户消息
    const userMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now()
    };

    currentMessages.push(userMessage);

    // 更新UI
    messageInput.value = '';
    renderMessages();

    // 保存到数据库
    window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages);

    // 更新聊天列表
    loadChatSessions();

    // 获取选中的模型
    const selectedModel = modelManager.getCurrentModel();
    if (!selectedModel) {
        showNotification('请先添加模型配置', 'warning');
        return;
    }

    // 准备发送给AI的消息
    const aiMessages = [];

    // 添加系统提示词
    if (selectedModel.systemPrompt) {
        aiMessages.push({
            role: 'system',
            content: selectedModel.systemPrompt
        });
    }

    // 添加对话历史
    currentMessages.forEach(msg => {
        if (msg.role !== 'system') {
            aiMessages.push({
                role: msg.role,
                content: msg.content
            });
        }
    });

    try {
        // 添加AI回复占位
        const aiMessage = {
            role: 'assistant',
            content: '',
            timestamp: Date.now()
        };

        currentMessages.push(aiMessage);
        renderMessages();

        // 调用AI API并处理流式输出
        await window.preload.aiUtil.callAI(selectedModel, aiMessages, (content) => {
            aiMessage.content = content;
            renderMessages();
        });

        // 保存到数据库
        window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages);

        // 更新聊天列表
        loadChatSessions();
    } catch (error) {
        console.error('发送消息失败:', error);

        // 移除加载中消息
        currentMessages.pop();

        // 添加错误消息
        const errorMessage = {
            role: 'assistant',
            content: `发生错误: ${error.message}`,
            timestamp: Date.now()
        };

        currentMessages.push(errorMessage);

        // 更新UI
        renderMessages();

        // 保存到数据库
        window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages);
    }
}




// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}
