# 开发文档

## 项目概述

本项目是一个 utools 插件，集成阿里云通义千问大模型，提供智能对话、网络搜索、流式响应等功能。

## 技术栈

- **前端框架**: 原生 HTML/CSS/JavaScript
- **Markdown 渲染**: Marked.js
- **代码高亮**: Highlight.js
- **API**: 阿里云 DashScope (OpenAI 兼容接口)
- **存储**: utools.dbStorage / localStorage

## 项目结构

```
web_search_ai_assisstant/
├── plugin.json              # utools 插件配置文件
├── package.json            # npm 包配置
├── preload.js             # utools 预加载脚本
├── index.html             # 主对话界面
├── settings.html          # 设置界面
├── js/
│   ├── main.js           # 主界面逻辑
│   ├── api.js            # API 封装
│   ├── storage.js        # 存储管理
│   └── settings.js       # 设置界面逻辑
├── css/
│   ├── style.css         # 主界面样式
│   └── settings.css      # 设置界面样式
├── README.md             # 项目说明
├── USAGE.md              # 使用指南
├── DEVELOPMENT.md        # 开发文档（本文件）
└── LOGO_README.md        # Logo 说明
```

## 核心模块说明

### 1. plugin.json

utools 插件配置文件，定义：
- 插件基本信息（名称、版本、描述等）
- 功能入口和触发关键词
- 预加载脚本路径

关键配置：
```json
{
  "features": [
    {
      "code": "ai_chat",      // 功能代码
      "explain": "AI 对话",   // 功能说明
      "cmds": ["AI", "通义"]  // 触发关键词
    }
  ]
}
```

### 2. preload.js

utools 插件生命周期管理：
- 定义插件进入/离开时的行为
- 提供 utools API 封装工具函数
- 处理路由和页面跳转

关键导出：
```javascript
window.exports = {
  "ai_chat": {
    mode: "none",
    args: {
      enter: (action) => { /* 进入回调 */ },
      leave: () => { /* 离开回调 */ }
    }
  }
}
```

### 3. js/api.js - QianwenAPI 类

封装通义千问 API 调用：

**主要方法**：
- `streamChat()`: 流式对话
- `chat()`: 非流式对话
- `validateApiKey()`: 验证 API Key

**流式调用原理**：
使用 Fetch API + ReadableStream 实现 SSE (Server-Sent Events) 解析：

```javascript
const response = await fetch(url, options);
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  // 解析 SSE 数据: data: {...}
}
```

**API 端点**：
- 基础 URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- 对话接口: `/chat/completions`

**请求格式**（OpenAI 兼容）：
```json
{
  "model": "qwen-plus",
  "messages": [...],
  "stream": true,
  "enable_search": true,
  "temperature": 0.7,
  "max_tokens": 2000
}
```

### 4. js/storage.js - StorageManager 类

数据持久化管理：

**存储键**：
- `ai_chat_config`: 配置信息
- `ai_chat_conversations`: 对话列表
- `ai_chat_current`: 当前对话 ID

**主要方法**：
- `saveConfig() / getConfig()`: 配置管理
- `saveConversations() / getConversations()`: 对话管理
- `addMessageToConversation()`: 添加消息
- `exportConversations() / importConversations()`: 导入导出

**存储适配**：
```javascript
// 优先使用 utools.dbStorage，否则降级到 localStorage
if (typeof utools !== 'undefined' && utools.dbStorage) {
  utools.dbStorage.setItem(key, value);
} else {
  localStorage.setItem(key, value);
}
```

### 5. js/main.js - ChatApp 类

主界面业务逻辑：

**核心流程**：
1. 初始化 → 加载配置 → 加载对话
2. 用户输入 → 调用 API → 流式渲染
3. 保存消息 → 更新 UI

**消息流式渲染**：
```javascript
let content = '';
api.streamChat(messages, 
  (chunk) => {
    content += chunk;
    element.innerHTML = renderMarkdown(content);
  },
  (error) => { /* 错误处理 */ },
  () => { /* 完成回调 */ }
);
```

**Markdown 渲染**：
使用 Marked.js 将 Markdown 转换为 HTML，配合 Highlight.js 进行代码高亮。

### 6. js/settings.js - SettingsPage 类

设置界面逻辑：
- 表单验证
- API Key 验证
- 主题切换
- 数据导入导出

## 开发调试

### 本地开发

1. 克隆项目
```bash
git clone <repository-url>
cd web_search_ai_assisstant
```

2. 在浏览器中打开（用于界面调试）
```bash
# 使用 VS Code Live Server 或其他本地服务器
# 访问 index.html 和 settings.html
```

3. 在 utools 中调试
- 打开 utools 开发者工具
- 导入本项目目录
- 测试功能

### 调试技巧

**1. 浏览器控制台**
```javascript
// 查看存储的数据
console.log(new StorageManager().getConfig());
console.log(new StorageManager().getConversations());

// 测试 API
const api = new QianwenAPI();
api.setApiKey('your-key');
api.chat([{role: 'user', content: 'hello'}]);
```

**2. utools 开发者工具**
- F12 打开开发者工具
- 查看 Console、Network、Storage
- 使用 `utools.showOpenDialog()` 等 API

**3. 日志输出**
在关键位置添加 `console.log()` 进行调试。

### 常见问题排查

**API 调用失败**：
1. 检查 Network 面板的请求详情
2. 确认 API Key 和请求参数正确
3. 查看响应错误信息

**存储问题**：
1. 检查 Storage 面板（Application → Storage）
2. 清空缓存重新测试
3. 确认 utools.dbStorage API 可用性

**样式问题**：
1. 使用开发者工具检查元素样式
2. 确认主题类名正确应用
3. 检查 CSS 优先级

## 扩展开发

### 添加新功能

1. **添加新的 API 功能**

在 `js/api.js` 中添加新方法：
```javascript
class QianwenAPI {
  async newFeature(params) {
    // 实现新功能
  }
}
```

2. **添加新的配置项**

在 `js/storage.js` 中更新默认配置：
```javascript
getDefaultConfig() {
  return {
    // ... 现有配置
    newOption: defaultValue
  };
}
```

在 `settings.html` 中添加 UI 控件。

3. **添加新的快捷键**

在 `js/main.js` 的 `bindEvents()` 中添加：
```javascript
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
    // 新快捷键功能
  }
});
```

### 集成其他 AI 模型

要集成其他 AI 服务（如 OpenAI、Claude 等）：

1. 修改 `js/api.js`，添加新的 API 类
2. 使用统一的接口封装不同的 API
3. 在设置中添加 API 选择器

示例：
```javascript
class AIApiFactory {
  static create(type) {
    switch(type) {
      case 'qianwen': return new QianwenAPI();
      case 'openai': return new OpenAIAPI();
      case 'claude': return new ClaudeAPI();
    }
  }
}
```

### 自定义主题

在 `css/style.css` 中添加新主题：
```css
body.custom-theme {
  background: #your-color;
  color: #your-color;
}
```

在主题切换逻辑中添加新选项。

### 添加插件功能

在 `plugin.json` 中添加新的 feature：
```json
{
  "code": "new_feature",
  "explain": "新功能",
  "cmds": ["关键词"]
}
```

在 `preload.js` 中添加对应的处理：
```javascript
window.exports = {
  "new_feature": {
    mode: "none",
    args: {
      enter: (action) => { /* 处理 */ }
    }
  }
}
```

## API 参考

### utools API

常用的 utools API：
- `utools.hideMainWindow()`: 隐藏主窗口
- `utools.showMainWindow()`: 显示主窗口
- `utools.outPlugin()`: 退出插件
- `utools.dbStorage.setItem()`: 存储数据
- `utools.dbStorage.getItem()`: 读取数据
- `utools.copyText()`: 复制到剪贴板
- `utools.readClipboard()`: 读取剪贴板
- `utools.ubrowser.goto()`: 打开页面

详细文档：https://u.tools/docs/developer/api.html

### 通义千问 API

文档：https://help.aliyun.com/zh/dashscope/

支持的模型：
- qwen-turbo
- qwen-plus
- qwen-max
- qwen-long
- qwen-plus-latest (支持联网搜索)
- qwen-max-latest (支持联网搜索)

## 打包发布

### 打包步骤

1. 确保所有文件都已保存
2. 确保有 logo.png 图标文件
3. 压缩整个项目文件夹为 zip 格式
4. 将 `.zip` 后缀改为 `.upx`

```bash
# 命令行打包
cd ..
zip -r web_search_ai_assisstant.upx web_search_ai_assisstant/ -x "*.git*" "node_modules/*"
```

### 发布到 utools 插件市场

1. 访问 utools 开发者中心
2. 上传 `.upx` 文件
3. 填写插件信息和截图
4. 提交审核

## 性能优化

1. **减少重渲染**：只更新变化的部分
2. **防抖节流**：输入框使用防抖
3. **虚拟滚动**：消息列表过长时使用虚拟滚动
4. **懒加载**：按需加载 Markdown 和代码高亮库
5. **缓存优化**：缓存常用数据

## 安全建议

1. **API Key 保护**：
   - 不要硬编码 API Key
   - 提醒用户不要泄露 API Key
   - 考虑添加本地加密

2. **XSS 防护**：
   - 用户输入进行 HTML 转义
   - 使用 DOMPurify 清理 Markdown 渲染结果

3. **数据备份**：
   - 提供导出功能
   - 定期提醒用户备份

## 贡献指南

欢迎提交 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

MIT License

## 联系方式

- GitHub: [Your GitHub]
- Email: [Your Email]

---

Happy Coding! 🎉

