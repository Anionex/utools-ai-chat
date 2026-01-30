# AI 聊天助手

uTools AI 聊天助手插件，使用 Vue 3 + Vite + Tailwind CSS 构建。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Pinia** - Vue 状态管理库
- **Tailwind CSS** - 原子化 CSS 框架
- **marked** - Markdown 解析库
- **highlight.js** - 代码高亮库

## 开发

### 安装依赖

```bash
cd vue-app
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

构建后的文件将输出到项目根目录。

## 项目结构

```
vue-app/
├── public/
│   ├── logo.png          # 插件图标
│   ├── plugin.json       # uTools 插件配置
│   └── preload.js        # uTools preload 脚本
├── src/
│   ├── components/       # Vue 组件
│   │   ├── AppNotification.vue     # 通知组件
│   │   ├── BaseModal.vue           # 基础弹窗组件
│   │   ├── ChatContainer.vue       # 聊天容器
│   │   ├── ChatItem.vue            # 聊天列表项
│   │   ├── ChatList.vue            # 聊天列表
│   │   ├── ChatMessage.vue         # 聊天消息
│   │   ├── ConfirmModal.vue        # 确认弹窗
│   │   ├── EditMessageModal.vue    # 编辑消息弹窗
│   │   ├── EmptyState.vue          # 空状态
│   │   ├── ModelSelectModal.vue    # 模型选择弹窗
│   │   ├── SettingsModal.vue       # 设置弹窗
│   │   └── ShortcutsModal.vue      # 快捷键弹窗
│   ├── stores/           # Pinia 状态管理
│   │   ├── chatStore.js            # 聊天状态
│   │   ├── commandStore.js         # 指令状态
│   │   ├── modelStore.js           # 模型状态
│   │   └── notificationStore.js    # 通知状态
│   ├── styles/
│   │   └── index.css     # 全局样式
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 安装到 uTools

1. 运行构建命令: `npm run build`
2. 打开 uTools 开发者工具
3. 新建插件项目，选择项目根目录的 `plugin.json`
4. 或直接将项目根目录打包为 `.upx` 文件

## 功能特性

- **多模型支持**: 支持添加并切换多个不同的 AI 模型配置
- **系统提示词**: 可为每个模型自定义系统提示词
- **历史记录**: 本地保存所有聊天记录
- **流式响应**: 支持 AI 回复的实时流式显示
- **Markdown 渲染**: AI 回复支持 Markdown 格式和代码高亮
- **文本工具**: 内置 AI 翻译、AI 解释和问 AI 功能
- **自定义指令**: 支持创建自定义 AI 指令

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + N` | 新建对话 |
| `Ctrl + Shift + M` | 切换到下一个模型 |
| `Ctrl + Alt + T` | 打开模型选择器 |
| `Enter` | 发送消息 |
| `Shift + Enter` | 换行 |


