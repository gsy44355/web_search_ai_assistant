# 代码块显示增强功能

## 功能概述

为 AI 对话助手增强了代码块的显示和交互功能，提供更好的代码阅读和使用体验。

## 🎨 主要功能

### 1. **语法高亮**
- ✅ 使用 `highlight.js` 自动识别并高亮显示代码
- ✅ 支持 190+ 种编程语言
- ✅ 根据语言自动应用不同的高亮规则
- ✅ 代码自动格式化，提高可读性

### 2. **一键复制**
- ✅ 每个代码块都有独立的复制按钮
- ✅ 点击按钮即可复制完整代码
- ✅ 复制成功后显示"已复制"提示
- ✅ 支持多种环境：utools、浏览器、降级方案
- ✅ 保留原始代码格式（缩进、换行等）

### 3. **美观的界面**
- ✅ 代码块带有圆角边框和阴影
- ✅ 顶部显示编程语言标签
- ✅ 复制按钮带有图标和动画效果
- ✅ 支持深色/浅色主题自动适配
- ✅ 横向滚动条美化

### 4. **行内代码优化**
- ✅ 行内代码（`` `code` ``）也有特殊样式
- ✅ 与代码块区分明显
- ✅ 适合短代码片段展示

## 📸 视觉效果

### 代码块结构
```
┌─────────────────────────────────────────┐
│ python                          [复制]  │  ← 头部（语言 + 复制按钮）
├─────────────────────────────────────────┤
│ def hello():                            │
│     print("Hello, World!")              │  ← 代码内容（语法高亮）
│     return True                         │
└─────────────────────────────────────────┘
```

### 样式特点

**深色主题：**
- 背景：深灰色 `#282c34`
- 代码：浅灰色 `#abb2bf`
- 头部：半透明黑色
- 复制按钮：半透明白色，悬停时高亮

**浅色主题：**
- 背景：浅灰色 `#f6f8fa`
- 代码：深灰色 `#24292e`
- 头部：浅灰色 `#f3f4f6`
- 复制按钮：白色，带边框

## 🔧 技术实现

### 1. Markdown 渲染器自定义

在 `js/main.js` 中：

```javascript
setupMarkdown() {
  const renderer = new marked.Renderer();
  
  // 自定义代码块渲染
  renderer.code = function(code, language) {
    const lang = language || 'text';
    const highlighted = hljs.highlight(code, { language: lang }).value;
    
    return `
      <div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-block-language">${lang}</span>
          <button class="code-copy-btn" onclick="window.chatApp.copyCode(...)">
            复制
          </button>
        </div>
        <pre><code class="hljs language-${lang}">${highlighted}</code></pre>
      </div>
    `;
  };
  
  marked.setOptions({ renderer, breaks: true, gfm: true });
}
```

### 2. 复制功能实现

```javascript
copyCode(button, escapedCode) {
  // 1. 还原转义的代码
  const textarea = document.createElement('textarea');
  textarea.innerHTML = escapedCode;
  const code = textarea.value;
  
  // 2. 复制到剪贴板（支持多种环境）
  if (typeof utools !== 'undefined') {
    utools.copyText(code);
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(code);
  } else {
    // 降级方案
    // ...
  }
  
  // 3. 显示反馈
  button.querySelector('.copy-text').textContent = '已复制';
  button.classList.add('copied');
}
```

### 3. CSS 样式

在 `css/style.css` 中添加了完整的样式：
- `.code-block-wrapper` - 代码块容器
- `.code-block-header` - 头部样式
- `.code-copy-btn` - 复制按钮（含悬停、点击效果）
- 主题适配（浅色/深色）
- 滚动条美化
- 响应式适配

## 📋 支持的编程语言

通过 `highlight.js` 支持 190+ 种语言，包括但不限于：

**主流语言：**
- JavaScript, TypeScript, Python, Java, C, C++, C#
- Go, Rust, Swift, Kotlin, PHP, Ruby, Perl
- HTML, CSS, SQL, Bash, Shell, PowerShell

**前端框架：**
- React (JSX), Vue, Angular, Svelte

**数据格式：**
- JSON, YAML, XML, TOML, INI

**其他：**
- Markdown, LaTeX, Diff, Dockerfile, Makefile
- 以及更多...

## 🎯 使用示例

### 示例 1：Python 代码

当 AI 返回：
````markdown
```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```
````

**显示效果：**
- 顶部显示 "PYTHON"
- 语法高亮（关键字、函数、字符串等）
- 右上角显示复制按钮
- 点击复制按钮，代码已复制到剪贴板

### 示例 2：JavaScript 代码

````markdown
```javascript
const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```
````

**显示效果：**
- 顶部显示 "JAVASCRIPT"
- `const`, `async`, `await` 等关键字高亮
- 字符串用不同颜色显示
- 一键复制完整代码

### 示例 3：行内代码

普通文本中的 `` `console.log('hello')` `` 会显示为行内代码样式。

## ⚙️ 配置说明

### 主题切换

代码块会自动适配当前主题：
- 点击 🌙/☀️ 按钮切换主题
- 代码块样式自动跟随
- 语法高亮主题也会切换（通过 `highlight.js` 的主题文件）

### 自定义样式

如果需要调整代码块样式，编辑 `css/style.css` 中的：
- `.code-block-wrapper` - 容器样式
- `.code-block-header` - 头部样式
- `.code-copy-btn` - 按钮样式

## 🐛 故障排除

### 问题 1：代码没有高亮

**原因：** `highlight.js` 没有加载或语言不支持

**解决：**
1. 检查 `index.html` 中是否引入了 `highlight.js`
2. 确保网络连接正常（CDN 加载）
3. 检查控制台是否有错误

### 问题 2：复制按钮不工作

**原因：** `window.chatApp` 未初始化或权限问题

**解决：**
1. 确保 `main.js` 正确加载
2. 检查浏览器是否允许剪贴板访问
3. 查看控制台错误信息

### 问题 3：代码块样式异常

**原因：** CSS 文件未加载或被覆盖

**解决：**
1. 检查 `css/style.css` 是否正确引入
2. 清除浏览器缓存
3. 检查是否有其他样式冲突

## 📊 性能优化

1. **按需高亮**
   - 只在渲染时进行语法高亮
   - 不影响消息加载速度

2. **轻量级复制**
   - 使用原生 API，无需额外库
   - 复制操作快速响应

3. **CSS 优化**
   - 使用 CSS 变量减少重复
   - 动画使用 `transition` 而非 `animation`

## 🚀 未来改进

可能的功能增强：
- [ ] 代码行号显示
- [ ] 代码折叠/展开
- [ ] 代码搜索功能
- [ ] 下载代码文件
- [ ] 多种主题选择（GitHub, Monokai, Dracula 等）
- [ ] 代码差异对比
- [ ] 在线运行代码（集成 CodePen、JSFiddle 等）

## 📝 更新日志

### v1.1.0 (2025-10-29)
- ✅ 新增代码块语法高亮
- ✅ 新增一键复制功能
- ✅ 优化代码块样式
- ✅ 支持深色/浅色主题
- ✅ 优化行内代码显示
- ✅ 添加复制反馈动画

---

**提示：** 此功能已完全集成到插件中，无需额外配置即可使用！

