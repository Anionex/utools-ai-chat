// 增强版preload.js，优化鼠标中键菜单集成功能
const { clipboard } = require('electron')

// 数据库操作相关函数
const dbUtil = {
  // 保存聊天记录
  saveChatHistory(sessionId, messages, lastTime) {
    // 如果提供了最后更新时间，保存会话元数据
    if (lastTime) {
      window.utools.dbStorage.setItem(`chat_meta_${sessionId}`, { lastTime });
    }
    return window.utools.dbStorage.setItem(`chat_history_${sessionId}`, messages);
  },
  
  // 获取聊天记录
  getChatHistory(sessionId) {
    return window.utools.dbStorage.getItem(`chat_history_${sessionId}`);
  },
  
  // 删除聊天记录
  deleteChatHistory(sessionId) {
    // 同时删除元数据
    window.utools.dbStorage.removeItem(`chat_meta_${sessionId}`);
    return window.utools.dbStorage.removeItem(`chat_history_${sessionId}`);
  },
  
  // 获取所有聊天会话
  getAllSessions() {
    // 使用正则表达式匹配所有聊天记录的key
    const allDocs = window.utools.db.allDocs();
    const sessions = allDocs.filter(doc => doc._id.startsWith('chat_history_'))
      .map(doc => {
        const sessionId = doc._id.replace('chat_history_', '');
        const messages = doc.value;
        
        // 尝试获取会话元数据
        const metaKey = `chat_meta_${sessionId}`;
        const meta = window.utools.dbStorage.getItem(metaKey);
        
        // 如果有消息并且有最后一条消息的时间戳，使用它；否则使用元数据中的时间戳；如果都没有则使用当前时间
        const lastTime = messages && messages.length > 0 ? 
          (messages[messages.length - 1]?.timestamp || Date.now()) : 
          (meta?.lastTime || Date.now());
        
        return {
          id: sessionId,
          messages: messages,
          lastTime: lastTime
        };
      });
    
    // 过滤掉空消息的会话
    return sessions.filter(session => session.messages && session.messages.length > 0);
  },
  
  // 保存模型配置
  saveModelConfig(config) {
    return window.utools.dbStorage.setItem('model_config', config);
  },
  
  // 获取模型配置
  getModelConfig() {
    return window.utools.dbStorage.getItem('model_config') || [];
  },

  // 保存当前选择的模型索引
  saveModelIndex(index) {
    return window.utools.dbStorage.setItem('model_index', index);
  },

  // 获取当前选择的模型索引
  getModelIndex() {
    return window.utools.dbStorage.getItem('model_index') || 0;
  }
}

// 处理AI API调用
const aiUtil = {
  // 用于存储当前的请求控制器
  currentController: null,

  // 中断当前的AI响应
  abortCurrentResponse() {
    if (this.currentController) {
      this.currentController.abort();
      this.currentController = null;
    }
  },

  // 调用AI API
  async callAI(modelConfig, messages, onProgress) {
    // 如果有正在进行的请求，先中断它
    this.abortCurrentResponse();

    // 创建新的 AbortController
    this.currentController = new AbortController();
    const signal = this.currentController.signal;

    try {
      const response = await fetch(modelConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${modelConfig.key}`
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages: messages,
          stream: true
        }),
        signal // 添加signal以支持中断
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '请求失败');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') continue;

          try {
            const json = JSON.parse(line.replace(/^data: /, ''));
            const token = json.choices[0]?.delta?.content || '';
            if (token) {
              content += token;
              onProgress(content);
            }
          } catch (e) {
            console.error('解析响应数据失败:', e);
          }
        }
      }

      // 清除当前控制器
      this.currentController = null;
      return content;
    } catch (error) {
      // 如果是中断导致的错误，不需要抛出
      if (error.name === 'AbortError') {
        return '';
      }
      throw error;
    }
  }
}

// 导出工具函数供前端使用
window.preload = {
  dbUtil,
  aiUtil
}

// 添加插件进入事件监听
window.utools.onPluginEnter(({ code, type, payload }) => {
  console.log('插件进入事件触发:', code, type, payload);
  
  // 获取当前可用的模型配置
  const modelConfigs = dbUtil.getModelConfig();
  if (!modelConfigs || modelConfigs.length === 0) {
    window.utools.showNotification('请先配置AI模型');
    return;
  }
  modelManager.setCurrentModel(dbUtil.getModelIndex());
  // 获取当前选择的模型
  const currentModelIndex = dbUtil.getModelIndex();
  const currentModel = modelConfigs[currentModelIndex] || modelConfigs[0];

  // 处理AI翻译功能
  if (code === 'ai-translate' && type === 'over' && payload) {
    // 创建一个唯一的会话ID
    const sessionId = 'translate_' + Date.now();
    
    // 创建翻译提示词
    const systemPrompt = "你是一个专业的翻译助手。请将用户输入的文本翻译成最适合的语言。如果内容是中文，请翻译成英文；如果是其他语言，请翻译成中文。请确保翻译准确、自然、符合目标语言的表达习惯。只返回翻译后的内容，不需要解释或添加其他信息。";
    
    // 构建消息数组
    const messages = [
      {
        role: 'system',
        content: systemPrompt,
        timestamp: Date.now()
      },
      {
        role: 'user',
        content: payload,
        timestamp: Date.now()
      }
    ];
    
    // 保存会话
    dbUtil.saveChatHistory(sessionId, messages);
    
    // 立即调用AI获取回复
    setTimeout(() => {
      // 触发一个自定义事件，让前端处理这个新会话
      document.dispatchEvent(new CustomEvent('ai-feature-triggered', { 
        detail: { 
          sessionId: sessionId,
          modelConfig: currentModel,
          systemPrompt: systemPrompt,
          userMessage: payload
        }
      }));
    }, 100);
  }
  
  // 处理AI解释功能
  if (code === 'ai-explain' && type === 'over' && payload) {
    // 创建一个唯一的会话ID
    const sessionId = 'explain_' + Date.now();
    
    // 创建解释提示词
    const systemPrompt = "你是一个专业的解释助手。请用简洁清晰的语言解释用户提供的内容。解释应该易于理解，同时保持准确性。如果内容涉及专业术语，请提供通俗的解释。根据内容的语言，使用相同的语言回复。";
    
    // 构建消息数组
    const messages = [
      {
        role: 'system',
        content: systemPrompt,
        timestamp: Date.now()
      },
      {
        role: 'user',
        content: payload,
        timestamp: Date.now()
      }
    ];
    
    // 保存会话
    dbUtil.saveChatHistory(sessionId, messages);
    
    // 立即调用AI获取回复
    setTimeout(() => {
      // 触发一个自定义事件，让前端处理这个新会话
      document.dispatchEvent(new CustomEvent('ai-feature-triggered', { 
        detail: { 
          sessionId: sessionId,
          modelConfig: currentModel,
          systemPrompt: systemPrompt,
          userMessage: payload
        }
      }));
    }, 100);
  }
});
