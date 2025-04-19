// 加载聊天记录
function loadChatSessions() {
    const sessions = window.preload.dbUtil.getAllSessions();

    chatList.innerHTML = '';

    if (sessions.length === 0) {
        return;
    }

    // 按时间戳倒序排序，最新的对话排在最上面
    sessions.sort((a, b) => b.lastTime - a.lastTime);

    // 按排序顺序添加到列表（最新的在前面）
    sessions.forEach(session => {
        addChatItemToList(session, false); // 不需要置顶，已经排序
    });
}

// 添加聊天项到列表
function addChatItemToList(session, placeOnTop = true) {
    const chatItem = document.createElement('li');
    chatItem.className = 'chat-item';
    chatItem.dataset.id = session.id;

    if (currentSessionId === session.id) {
        chatItem.classList.add('active');
    }

    const lastMessage = session.messages[session.messages.length - 1];
    const title = session.messages[1]?.content.substring(0, 20) || '新对话';
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

    // 决定是添加到顶部还是按顺序添加
    if (placeOnTop && chatList.firstChild) {
        chatList.insertBefore(chatItem, chatList.firstChild);
    } else {
        chatList.appendChild(chatItem);
    }
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
        if (currentMessages[1] == null) {
            chatTitle.textContent = currentMessages[0].content.substring(0, 20);
        } else {
            chatTitle.textContent = currentMessages[1].content.substring(0, 20);
        }
    } else {
        chatTitle.textContent = '新对话';
    }

    // 更新消息列表
    renderMessages();
}

// 渲染消息
function renderMessages() {
    chatMessages.innerHTML = '';

    currentMessages.forEach((msg, index) => {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${msg.role === 'user' ? 'user' : msg.role === 'system' ? 'system' : 'ai'}`;
        console.log(currentMessages);
        const messageContent = document.createElement('div');

        // 使用Markdown渲染AI消息
        if (msg.role === 'assistant') {
            messageContent.className = 'markdown-content';
            messageContent.innerHTML = marked.parse(msg.content);
            // 高亮代码块
            messageEl.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });

            // 为AI消息添加重试按钮
            const retryButton = document.createElement('div');
            retryButton.className = 'message-retry';
            retryButton.title = '重新发送';
            retryButton.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 2v6h-6"></path>
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                    <path d="M3 22v-6h6"></path>
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                </svg>
            `;
            retryButton.addEventListener('click', () => retryMessage(index));
            messageEl.appendChild(retryButton);
        } else {
            // 用户消息和系统消息使用相同的显示逻辑
            messageContent.textContent = msg.content;
        }

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = formatTime(msg.timestamp);

        messageEl.appendChild(messageContent);
        messageEl.appendChild(messageTime);
        
        // 添加消息操作按钮容器
        const messageActions = document.createElement('div');
        messageActions.className = 'message-actions';
        
        // 添加复制按钮
        const copyButton = document.createElement('div');
        copyButton.className = 'message-action message-copy';
        copyButton.title = '复制消息';
        copyButton.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;
        copyButton.addEventListener('click', () => copyMessage(msg.content));
        
        // 添加编辑按钮
        const editButton = document.createElement('div');
        editButton.className = 'message-action message-edit';
        editButton.title = '编辑消息';
        editButton.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        `;
        editButton.addEventListener('click', () => editMessage(index));
        
        // 添加删除按钮
        const deleteButton = document.createElement('div');
        deleteButton.className = 'message-action message-delete';
        deleteButton.title = '删除消息';
        deleteButton.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        `;
        deleteButton.addEventListener('click', () => deleteMessage(index));
        
        // 将按钮添加到操作容器
        messageActions.appendChild(copyButton);
        messageActions.appendChild(editButton);
        messageActions.appendChild(deleteButton);
        
        // 将操作容器添加到消息元素
        messageEl.appendChild(messageActions);

        chatMessages.appendChild(messageEl);
    });

    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 重试发送消息
async function retryMessage(messageIndex) {
    // 获取要重试的消息的前一条用户消息
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && currentMessages[userMessageIndex].role !== 'user') {
        userMessageIndex--;
    }

    const userMessage = currentMessages[userMessageIndex];
    if (!userMessage || userMessage.role !== 'user') {
        showNotification('无法重试：找不到对应的用户消息', 'error');
        return;
    }

    // 移除当前的AI回复
    currentMessages.splice(messageIndex, 1);

    // 获取选中的模型
    const selectedModel = modelManager.getCurrentModel();
    if (!selectedModel) {
        showNotification('请先添加模型配置', 'warning');
        return;
    }

    // 准备发送给AI的消息
    const aiMessages = [];

    // 添加对话历史（到用户消息为止）
    for (let i = 0; i <= userMessageIndex; i++) {
        aiMessages.push({
            role: currentMessages[i].role,
            content: currentMessages[i].content
        });
    }

    try {
        // 添加新的AI回复占位
        const aiMessage = {
            role: 'assistant',
            content: '',
            timestamp: Date.now()
        };

        currentMessages.push(aiMessage);
        renderMessages();

        // 更新重试按钮状态
        const retryButton = document.querySelector('.message-retry');
        if (retryButton) {
            retryButton.classList.add('spin');
        }

        // 更新发送按钮状态为停止状态
        updateSendButtonState(true);

        // 调用AI API并处理流式输出
        await window.preload.aiUtil.callAI(selectedModel, aiMessages, (content) => {
            aiMessage.content = content;
            renderMessages();
        });

        // 恢复发送按钮状态
        updateSendButtonState(false);

        // 更新最后修改时间
        const currentTime = Date.now();

        // 保存到数据库
        window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages, currentTime);

        // 更新聊天列表
        loadChatSessions();
    } catch (error) {
        console.error('重试发送消息失败:', error);

        // 恢复发送按钮状态
        updateSendButtonState(false);

        // 移除失败的消息
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

        // 保存到数据库，记录最后修改时间
        const currentTime = Date.now();
        window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages, currentTime);

        // 显示错误通知
        showNotification(error.message, 'error');
    }
}

// 清理空对话
function cleanEmptySessions() {
    const sessions = window.preload.dbUtil.getAllSessions();
    
    // 找出消息为空的会话
    const emptySessions = sessions.filter(session => !session.messages || session.messages.length === 0);
    
    // 删除空会话
    emptySessions.forEach(session => {
        window.preload.dbUtil.deleteChatHistory(session.id);
    });
    
    // 如果当前会话是空会话，清空当前会话
    if (currentSessionId && emptySessions.some(session => session.id === currentSessionId)) {
        currentSessionId = null;
        currentMessages = [];
        updateChatUI();
    }
    
    // 如果删除了会话，重新加载聊天列表
    if (emptySessions.length > 0) {
        loadChatSessions();
    }
    
    return emptySessions.length;
}

// 创建新会话
function createNewChat() {
    console.log('创建新会话');
    currentSessionId = Date.now().toString();
    currentMessages = [];
    syncModelState();
    
    // 添加系统提示词
    const selectedModel = modelManager.getCurrentModel();
    if (selectedModel && selectedModel.systemPrompt) {
        const systemPrompt = selectedModel.systemPrompt.trim();
        if (systemPrompt) {
            currentMessages.push({ role: 'system', content: systemPrompt, timestamp: Date.now() });
        }
    }
    // 更新UI
    console.log('更新UI:' + currentMessages);
    updateChatUI();

    // 创建会话对象
    const session = {
        id: currentSessionId,
        messages: currentMessages,
        lastTime: Date.now()
    };

    // 添加到列表顶部
    addChatItemToList(session);

    // 不立即保存空对话到数据库，只有在发送消息后才保存
    // window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages);

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

// 更新发送按钮状态
function updateSendButtonState(isGenerating = false) {
    const button = document.getElementById('send-button');
    const icon = button.querySelector('.icon');
    
    if (isGenerating) {
        button.classList.add('stop');
        button.disabled = false; // 确保按钮可以点击
        // 修改为停止图标（实心圆）
        icon.innerHTML = `
            <circle cx="12" cy="12" r="8" fill="currentColor"/>
        `;
        // 添加点击事件处理
        button.onclick = () => {
            window.preload.aiUtil.abortCurrentResponse();
            updateSendButtonState(false);
        };
    } else {
        button.classList.remove('stop');
        // 根据输入框是否为空来设置禁用状态
        button.disabled = messageInput.value.trim() === '';
        // 恢复发送图标
        icon.innerHTML = `
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        `;
        // 恢复原始点击事件
        button.onclick = sendMessage;
    }
}

// 发送消息
async function sendMessage() {
    const button = document.getElementById('send-button');
    const isGenerating = button.classList.contains('stop');

    // 如果正在生成，则中断
    if (isGenerating) {
        window.preload.aiUtil.abortCurrentResponse();
        updateSendButtonState(false);
        return;
    }

    const message = messageInput.value.trim();
    if (!message) return;

    // 如果没有当前会话，创建一个新会话
    if (currentSessionId === null) {
        createNewChat();
    }

    // 获取选中的模型
    const selectedModel = modelManager.getCurrentModel();
    if (!selectedModel) {
        showNotification('请先添加模型配置', 'warning');
        return;
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

    // 更新会话最后修改时间
    const currentTime = Date.now();
    
    // 保存到数据库
    window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages, currentTime);

    // 更新聊天列表
    loadChatSessions();

    // 准备发送给AI的消息
    const aiMessages = [];

    // 添加对话历史
    currentMessages.forEach(msg => {
        aiMessages.push({
            role: msg.role,
            content: msg.content
        });
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

        // 更新按钮状态为停止
        updateSendButtonState(true);

        // 调用AI API并处理流式输出
        await window.preload.aiUtil.callAI(selectedModel, aiMessages, (content) => {
            aiMessage.content = content;
            renderMessages();
        });

        // 恢复按钮状态
        updateSendButtonState(false);

        // 保存到数据库
        window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages, currentTime);

        // 更新聊天列表
        loadChatSessions();
    } catch (error) {
        console.error('发送消息失败:', error);

        // 恢复按钮状态
        updateSendButtonState(false);

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
        window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages, currentTime);

        // 显示错误通知
        showNotification(error.message, 'error');
    }
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// 删除消息
function deleteMessage(messageIndex) {
    if (messageIndex < 0 || messageIndex >= currentMessages.length) {
        showNotification('无效的消息索引', 'error');
        return;
    }

    // 显示确认对话框
    showConfirm('确定要删除这条消息吗？', (confirmed) => {
        if (!confirmed) return;
        
        // 删除该消息
        currentMessages.splice(messageIndex, 1);
        
        // 如果删除后没有消息了，可以选择删除整个会话
        if (currentMessages.length === 0) {
            showConfirm('会话中没有消息了，是否删除整个会话？', (confirmed) => {
                if (confirmed) {
                    deleteChatSession(currentSessionId);
                }
            });
            return;
        }
        
        // 更新UI
        renderMessages();
        
        // 保存到数据库，记录最后修改时间
        const currentTime = Date.now();
        window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages, currentTime);
        
        // 更新聊天列表
        loadChatSessions();
        
        // 显示成功通知
        showNotification('消息已删除', 'success');
    });
}

// 编辑消息
function editMessage(messageIndex) {
    if (messageIndex < 0 || messageIndex >= currentMessages.length) {
        showNotification('无效的消息索引', 'error');
        return;
    }
    
    const message = currentMessages[messageIndex];
    
    // 创建编辑区域
    const modal = document.createElement('div');
    modal.className = 'edit-message-modal';
    modal.innerHTML = `
        <div class="edit-message-container">
            <div class="edit-message-header">
                <h3>编辑${message.role === 'user' ? '用户' : 'AI'}消息</h3>
                <button class="close-btn">&times;</button>
            </div>
            <textarea class="edit-message-textarea">${message.content}</textarea>
            <div class="edit-message-actions">
                <button class="cancel-btn">取消</button>
                <button class="save-btn">保存</button>
            </div>
        </div>
    `;
    
    // 添加到文档
    document.body.appendChild(modal);
    
    // 设置焦点到文本区域
    const textarea = modal.querySelector('.edit-message-textarea');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    
    // 关闭按钮事件
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 取消按钮事件
    const cancelBtn = modal.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 保存按钮事件
    const saveBtn = modal.querySelector('.save-btn');
    saveBtn.addEventListener('click', () => {
        const newContent = textarea.value.trim();
        
        if (newContent === '') {
            showNotification('消息内容不能为空', 'warning');
            return;
        }
        
        // 更新消息内容
        message.content = newContent;
        
        // 移除模态框
        document.body.removeChild(modal);
        
        // 更新UI
        renderMessages();
        
        // 保存到数据库，记录最后修改时间
        const currentTime = Date.now();
        window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages, currentTime);
        
        // 更新聊天列表
        loadChatSessions();
        
        // 显示成功通知
        showNotification('消息已更新', 'success');
        
        // 如果编辑的是用户消息，并且下一条是AI消息，可以选择是否重新生成AI回复
        if (message.role === 'user' && messageIndex + 1 < currentMessages.length && currentMessages[messageIndex + 1].role === 'assistant') {
            showConfirm('是否需要根据修改后的消息重新生成AI回复？', (confirmed) => {
                if (confirmed) {
                    retryMessage(messageIndex + 1);
                }
            });
        }
    });
    
    // ESC键关闭
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
        }
    });
}

// 复制消息内容
function copyMessage(content) {
    // 使用clipboard API复制文本
    navigator.clipboard.writeText(content)
        .then(() => {
            showNotification('已复制到剪贴板', 'success');
        })
        .catch(err => {
            console.error('复制失败:', err);
            
            // 如果clipboard API不可用，使用传统方法
            const textarea = document.createElement('textarea');
            textarea.value = content;
            textarea.style.position = 'fixed';  // 防止影响页面布局
            textarea.style.opacity = 0;
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showNotification('已复制到剪贴板', 'success');
                } else {
                    showNotification('复制失败', 'error');
                }
            } catch (err) {
                console.error('复制失败:', err);
                showNotification('复制失败', 'error');
            }
            
            document.body.removeChild(textarea);
        });
}

// 更新当前会话的系统提示词
function updateSystemPrompt() {
    if (!currentSessionId) return;
    
    const selectedModel = modelManager.getCurrentModel();
    if (!selectedModel) return;
    
    const systemPrompt = selectedModel.systemPrompt.trim();
    
    // 查找是否已有系统消息
    const systemIndex = currentMessages.findIndex(msg => msg.role === 'system');
    
    if (systemPrompt) {
        // 构建系统消息
        const systemMessage = {
            role: 'system',
            content: systemPrompt,
            timestamp: Date.now()
        };
        
        if (systemIndex >= 0) {
            // 更新现有系统消息
            currentMessages[systemIndex] = systemMessage;
        } else {
            // 在消息列表开头添加系统消息
            currentMessages.unshift(systemMessage);
        }
    } else if (systemIndex >= 0) {
        // 如果没有系统提示词但存在系统消息，则移除它
        currentMessages.splice(systemIndex, 1);
    }
    
    // 更新UI
    renderMessages();
    
    // 保存到数据库
    window.preload.dbUtil.saveChatHistory(currentSessionId, currentMessages, Date.now());
}

// 在模型切换时同步更新UI和会话状态
function syncModelState() {
    // 获取当前选中的模型
    const selectedModel = modelManager.getCurrentModel();
    if (!selectedModel) return;
    
    // 更新UI显示
    const modelNameElement = document.getElementById('model-select');
    if (modelNameElement) {
        console.log('syncModelState更新UI显示:' + selectedModel.name);
        modelNameElement.selectedOptions[0].text = selectedModel.name;
    }
    
    // 如果当前有活动会话且只有一条消息，更新系统提示词
    if (currentSessionId && currentMessages.length == 1) {
        updateSystemPrompt();
    }
    
    console.log('模型已同步: ' + selectedModel.name);
}
