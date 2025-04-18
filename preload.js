// 增强版preload.js，优化鼠标中键菜单集成功能
const { clipboard } = require('electron')

// 数据库操作相关函数
const dbUtil = {
  // 保存聊天记录
  saveChatHistory(sessionId, messages) {
    return window.utools.dbStorage.setItem(`chat_history_${sessionId}`, messages)
  },
  
  // 获取聊天记录
  getChatHistory(sessionId) {
    return window.utools.dbStorage.getItem(`chat_history_${sessionId}`)
  },
  
  // 删除聊天记录
  deleteChatHistory(sessionId) {
    return window.utools.dbStorage.removeItem(`chat_history_${sessionId}`)
  },
  
  // 获取所有聊天会话
  getAllSessions() {
    // 使用正则表达式匹配所有聊天记录的key
    const allDocs = window.utools.db.allDocs()
    return allDocs.filter(doc => doc._id.startsWith('chat_history_'))
      .map(doc => {
        const sessionId = doc._id.replace('chat_history_', '')
        return {
          id: sessionId,
          messages: doc.value,
          lastTime: doc.value[doc.value.length - 1]?.timestamp || Date.now()
        }
      })
      .sort((a, b) => b.lastTime - a.lastTime)
  },
  
  // 保存模型配置
  saveModelConfig(config) {
    return window.utools.dbStorage.setItem('model_config', config)
  },
  
  // 获取模型配置
  getModelConfig() {
    return window.utools.dbStorage.getItem('model_config') || []
  }
}

// 处理AI API调用
const aiUtil = {
  // 调用AI API
  async callAI(modelConfig, messages, onProgress) {
    try {
      const { url, key, model } = modelConfig
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          stream: true
        })
      })
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`)
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let content = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            
            try {
              const json = JSON.parse(data)
              const delta = json.choices[0].delta.content
              if (delta) {
                content += delta
                if (onProgress) onProgress(content)
              }
            } catch (e) {
              console.error('解析数据失败:', e)
            }
          }
        }
      }
      
      return content
    } catch (error) {
      console.error('AI API调用失败:', error)
      return `调用AI服务失败: ${error.message}`
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
      clipboard.writeText(result)
      
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
              alert('已复制到剪贴板');
            })
            .catch(err => {
              console.error('复制失败:', err);
              alert('复制失败，请手动选择文本复制');
            });
        });
        
        document.getElementById('close-btn').addEventListener('click', () => {
          window.close();
        });
      </script>
    </body>
    </html>
    `;
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
