# 自动提问功能说明

## 功能概述

现在插件支持在 utools 输入框中直接输入任何问题，自动创建新会话并发送问题。

## 使用方法

### 方式一：普通对话入口
1. 在 utools 中输入关键词：`AI`、`ai`、`通义`、`千问`、`对话`
2. 进入插件后手动输入问题

### 方式二：自动提问入口（新功能）
1. 在 utools 输入框中直接输入您的问题（任何内容）
2. 选择 "向 AI 提问" 选项
3. 插件会自动：
   - 创建一个新的会话
   - 将您输入的问题填入输入框
   - 自动发送问题
   - 开始获取 AI 回答

## 示例

假设您想问："今天天气怎么样？"

**传统方式：**
1. 输入 `AI` → 回车
2. 等待插件打开
3. 输入问题 "今天天气怎么样？"
4. 回车发送

**新方式：**
1. 直接输入 "今天天气怎么样？"
2. 选择 "向 AI 提问"
3. 插件自动完成后续步骤

## 技术实现

### 1. plugin.json
新增了 `ai_ask` 功能项，使用正则表达式匹配任何输入：
```json
{
  "code": "ai_ask",
  "explain": "向 AI 提问（支持直接输入问题）",
  "cmds": [
    {
      "type": "regex",
      "label": "向 AI 提问",
      "match": "/(.+)/",
      "minLength": 1
    }
  ]
}
```

### 2. preload.js
在 `ai_ask` 的 enter 回调中，获取用户输入并存储到 sessionStorage：
```javascript
"ai_ask": {
  mode: "none",
  args: {
    enter: (action) => {
      if (action && action.payload) {
        const question = action.payload.trim();
        sessionStorage.setItem('autoAskQuestion', question);
      }
    }
  }
}
```

### 3. main.js
在初始化时检查 sessionStorage，如果有问题则自动创建会话并发送：
```javascript
// 检查是否有自动提问
else if (sessionStorage.getItem('autoAskQuestion')) {
  const question = sessionStorage.getItem('autoAskQuestion');
  sessionStorage.removeItem('autoAskQuestion');
  
  if (!this.config.apiKey) {
    this.showConfigPrompt();
  } else {
    setTimeout(() => this.autoAskQuestion(question), 100);
  }
}
```

新增 `autoAskQuestion` 方法：
```javascript
autoAskQuestion(question) {
  // 创建新会话
  const newConv = this.storage.createNewConversation();
  this.conversations.unshift(newConv);
  this.storage.saveConversations(this.conversations);
  this.switchConversation(newConv.id);
  
  // 填充问题并自动发送
  this.messageInput.value = question;
  this.adjustTextareaHeight();
  
  setTimeout(() => {
    this.sendMessage();
  }, 300);
}
```

## 注意事项

1. **需要配置 API Key**：如果未配置 API Key，会提示用户先进行配置
2. **自动创建新会话**：每次使用自动提问功能都会创建一个新会话
3. **支持任何文本**：只要在 utools 输入框中输入任何文本（至少1个字符），都会触发此功能
4. **与普通对话共存**：不会影响原有的 "AI 对话" 功能

## 更新日志

- **v1.1.0** (2025-10-29)
  - 新增自动提问功能
  - 支持在 utools 输入框直接输入问题
  - 自动创建新会话并发送问题

