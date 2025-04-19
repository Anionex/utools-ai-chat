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
  },
  
  // 翻译文本
  async translateText(modelConfig, text, onProgress) {
    const messages = [
      { role: 'system', content: '你是一个翻译助手，请将用户输入的文本翻译成中文或英文（根据输入语言自动判断）。' },
      { role: 'user', content: text }
    ]
    return this.callAI(modelConfig, messages, onProgress)
  },
  
  // 解释文本
  async explainText(modelConfig, text, onProgress) {
    const messages = [
      { role: 'system', content: '你是一个解释助手，请详细解释用户输入的文本内容，包括概念、背景和相关知识。' },
      { role: 'user', content: text }
    ]
    return this.callAI(modelConfig, messages, onProgress)
  }
}

// 上下文菜单处理
const contextMenuUtil = {
  // 处理选中文本
  async handleSelectedText(text, action) {
    console.log(`处理选中文本: ${text}, 动作: ${action}`);
    
    // 获取默认模型配置
    const modelConfigs = dbUtil.getModelConfig()
    if (!modelConfigs || modelConfigs.length === 0) {
      window.utools.showNotification('请先在AI聊天助手中配置模型')
      return
    }
    
    const defaultModel = modelConfigs[0]
    
    try {
      // 显示处理中通知
      window.utools.showNotification(`正在${action === 'translate' ? '翻译' : '解释'}文本...`)
      
      // 创建结果窗口并显示处理进度
      let result = ''
      const updateWindow = (content) => {
        result = content
        this.updateResultWindow(action === 'translate' ? 'AI翻译结果' : 'AI解释结果', content)
      }
      
      // 初始化结果窗口
      this.createResultWindow(action === 'translate' ? 'AI翻译结果' : 'AI解释结果', '处理中...')
      
      // 根据动作类型执行翻译或解释
      if (action === 'translate') {
        result = await aiUtil.translateText(defaultModel, text, updateWindow)
      } else if (action === 'explain') {
        result = await aiUtil.explainText(defaultModel, text, updateWindow)
      }
      
      // 复制结果到剪贴板
      this.copyToClipboard(result)
      
      // 显示成功通知
      window.utools.showNotification(`${action === 'translate' ? '翻译' : '解释'}完成，结果已复制到剪贴板`)
      
      // 返回结果
      return result
    } catch (error) {
      console.error(`处理文本失败:`, error)
      window.utools.showNotification(`处理失败: ${error.message}`)
      this.updateResultWindow(action === 'translate' ? 'AI翻译结果' : 'AI解释结果', `处理失败: ${error.message}`)
      return `处理失败: ${error.message}`
    }
  },
  
  // 创建结果显示窗口
  createResultWindow(title, initialContent) {
    // 创建一个临时HTML文件
    const tempHtml = this.generateResultHtml(title, initialContent)
    
    // 使用ubrowser显示结果
    this.resultBrowser = window.utools.ubrowser
      .goto(`data:text/html;charset=utf-8,${encodeURIComponent(tempHtml)}`)
      .run({ width: 800, height: 600, center: true })
  },
  
  // 更新结果窗口内容
  updateResultWindow(title, content) {
    const script = `
      document.querySelector('.result').innerHTML = marked.parse(${JSON.stringify(content)});
      document.title = ${JSON.stringify(title)};
      document.querySelector('h2').textContent = ${JSON.stringify(title)};
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    `
    
    if (this.resultBrowser) {
      this.resultBrowser.eval(script)
    }
  },
  
  // 生成结果HTML
  generateResultHtml(title, content) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.7.0/lib/highlight.min.js"></script>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.7.0/styles/github.min.css">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          padding: 20px;
          line-height: 1.6;
          background-color: #f8f9fa;
          color: #333;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h2 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #333;
        }
        .result {
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 15px;
          margin-top: 10px;
          white-space: pre-wrap;
        }
        .actions {
          margin-top: 15px;
          display: flex;
          gap: 10px;
        }
        button {
          padding: 8px 12px;
          background-color: #666;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        button:hover {
          background-color: #888;
        }
        
        /* Markdown样式 */
        .result {
          line-height: 1.6;
        }
        .result h1, .result h2, .result h3, 
        .result h4, .result h5, .result h6 {
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        .result p {
          margin-bottom: 1em;
        }
        .result ul, .result ol {
          margin-bottom: 1em;
          padding-left: 2em;
        }
        .result pre {
          background-color: #f0f0f0;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          margin-bottom: 1em;
        }
        .result code {
          background-color: #f0f0f0;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
        }
        .result pre code {
          padding: 0;
          background-color: transparent;
        }
        .result blockquote {
          border-left: 4px solid #ddd;
          padding-left: 1em;
          margin-left: 0;
          margin-bottom: 1em;
          color: #666;
        }
        .result table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1em;
        }
        .result table th, .result table td {
          border: 1px solid #ddd;
          padding: 8px;
        }
        .result table th {
          background-color: #f0f0f0;
          text-align: left;
        }
        .result img {
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>${title}</h2>
        <div class="result">${content}</div>
        <div class="actions">
          <button id="copy-btn">复制结果</button>
          <button id="close-btn">关闭窗口</button>
        </div>
      </div>
      <script>
        // 配置Markdown渲染器
        marked.setOptions({
          highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
          },
          langPrefix: 'hljs language-',
          gfm: true,
          breaks: true
        });
        
        // 初始渲染
        document.querySelector('.result').innerHTML = marked.parse(document.querySelector('.result').textContent);
        
        // 高亮代码块
        document.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });
        
        document.getElementById('copy-btn').addEventListener('click', () => {
          const text = document.querySelector('.result').textContent;
          navigator.clipboard.writeText(text)
            .then(() => {
              window.utools.showNotification('已复制到剪贴板', 'success');
            })
            .catch(err => {
              console.error('复制失败:', err);
              window.utools.showNotification('复制失败，请手动选择文本复制', 'error');
            });
        });
        
        document.getElementById('close-btn').addEventListener('click', () => {
          window.close();
        });
      </script>
    </body>
    </html>
    `;
  },
  
  // 复制文本到剪贴板
  copyToClipboard: (text) => {
    try {
      navigator.clipboard.writeText(text);
      ipcRenderer.send('show-notification', '已复制到剪贴板', 'success');
    } catch (error) {
      ipcRenderer.send('show-notification', '复制失败，请手动选择文本复制', 'error');
    }
  }
}

// 导出预加载模块
window.exports = {
  // 初始化函数，在插件加载时调用
  'ai-chat': {
    mode: 'list',
    args: {
      enter: (action, callbackSetList) => {
        // 进入插件时的处理逻辑
        callbackSetList([
          {
            title: 'AI聊天助手',
            description: '点击进入AI聊天界面',
            icon: 'logo.png',
            url: 'index.html'
          }
        ])
      },
      select: (action, itemData) => {
        window.utools.hideMainWindow()
        const url = itemData.url
        // 打开聊天界面
        if (url) {
          window.utools.ubrowser.goto(url)
            .run({ width: 800, height: 600 })
        }
      }
    }
  },
  
  // AI翻译功能
  'ai-translate': {
    mode: 'none',
    args: {
      enter: async (action, callbackSetList) => {
        console.log('进入AI翻译功能:', action);
        
        // 获取选中的文本
        const text = action.payload
        
        // 如果没有选中文本，直接返回
        if (!text) {
          window.utools.showNotification('请先选择要翻译的文本')
          return
        }
        
        console.log('选中的文本:', text);
        console.log('动作类型:', action.type);
        
        try {
          // 执行翻译
          console.log('执行AI翻译');
          await contextMenuUtil.handleSelectedText(text, 'translate');
        } catch (error) {
          console.error('处理翻译操作出错:', error);
          window.utools.showNotification(`翻译失败: ${error.message}`);
        }
        
        // 关闭uTools主窗口
        window.utools.hideMainWindow()
      }
    }
  },
  
  // AI解释功能
  'ai-explain': {
    mode: 'none',
    args: {
      enter: async (action, callbackSetList) => {
        console.log('进入AI解释功能:', action);
        
        // 获取选中的文本
        const text = action.payload
        
        // 如果没有选中文本，直接返回
        if (!text) {
          window.utools.showNotification('请先选择要解释的文本')
          return
        }
        
        console.log('选中的文本:', text);
        console.log('动作类型:', action.type);
        
        try {
          // 执行解释
          console.log('执行AI解释');
          await contextMenuUtil.handleSelectedText(text, 'explain');
        } catch (error) {
          console.error('处理解释操作出错:', error);
          window.utools.showNotification(`解释失败: ${error.message}`);
        }
        
        // 关闭uTools主窗口
        window.utools.hideMainWindow()
      }
    }
  }
}

// 导出工具函数供前端使用
window.preload = {
  dbUtil,
  aiUtil,
  contextMenuUtil
}
