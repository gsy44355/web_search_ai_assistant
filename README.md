# 通义千问 AI 助手 - utools 插件

<div align="center">

一个功能强大的 utools 插件，集成阿里云通义千问大模型，支持网络搜索、流式响应、多轮对话等功能。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![utools](https://img.shields.io/badge/utools-plugin-blue.svg)](https://u.tools/)
[![Alibaba Qianwen](https://img.shields.io/badge/AI-通义千问-orange.svg)](https://tongyi.aliyun.com/)

[快速开始](QUICKSTART.md) | [使用指南](USAGE.md) | [开发文档](DEVELOPMENT.md)

</div>

---

## ✨ 功能特性

<table>
<tr>
<td width="50%">

### 🤖 智能对话
- 基于阿里云通义千问大模型
- 支持多种模型切换
- 流式响应，实时显示回复
- 上下文连续对话

### 🌐 网络搜索
- 实时联网获取最新信息
- 支持新闻、股票、天气等查询
- 自动判断是否需要搜索
- 搜索结果融入回复

</td>
<td width="50%">

### 💬 对话管理
- 创建多个独立对话会话
- 对话历史自动保存
- 支持导入导出对话
- 快速切换和删除

### 🎨 个性化定制
- 深色/浅色主题切换
- 自定义系统提示词
- 灵活调整模型参数
- Markdown 渲染、代码高亮

</td>
</tr>
</table>

## 📦 安装

### 方式一：开发者模式（推荐）

```bash
1. 打开 utools，按 Ctrl/Cmd + I 打开插件管理
2. 点击右上角齿轮 → "开发者工具"
3. 点击"导入开发插件"
4. 选择本项目文件夹
```

### 方式二：打包安装

```bash
# 将项目打包为 .upx 格式
zip -r plugin.upx . -x "*.git*"
# 在 utools 中选择从本地安装
```

## 🚀 快速开始

### 1. 获取 API Key

访问 [阿里云 DashScope 控制台](https://dashscope.console.aliyun.com/apiKey) 获取 API Key

💰 新用户通常有免费额度可用

### 2. 配置插件

```
1. 在 utools 中输入 "AI设置"
2. 粘贴 API Key
3. 选择模型（推荐：qwen-plus-latest）
4. 启用网络搜索
5. 保存设置
```

### 3. 开始对话

```
在 utools 中输入 "AI" → 输入问题 → Enter 发送
```

详细步骤请查看 [快速开始指南](QUICKSTART.md)

## 📸 功能预览

### 主界面
- 现代化的聊天 UI
- 流式回复，逐字显示
- 支持 Markdown 和代码高亮
- 侧边栏对话管理

### 设置界面
- API Key 配置和验证
- 多模型选择
- 高级参数调整
- 数据导入导出

## 🎯 使用场景

| 场景 | 示例 |
|------|------|
| 📰 **实时信息** | "今天的热门新闻"、"比特币最新价格" |
| 💻 **编程助手** | "用 Python 写一个排序算法"、"解释这段代码" |
| 📝 **写作助手** | "帮我写一封邮件"、"润色这段文字" |
| 🌐 **翻译助手** | "翻译成英文"、"解释这个词组" |
| 🎓 **学习助手** | "解释量子计算"、"帮我解这道题" |

## 🔧 支持的模型

| 模型 | 速度 | 性能 | 联网搜索 | 适用场景 |
|------|:----:|:----:|:--------:|----------|
| qwen-turbo | ⭐⭐⭐ | ⭐⭐ | ❌ | 日常对话 |
| qwen-plus | ⭐⭐ | ⭐⭐⭐ | ❌ | 通用推荐 |
| qwen-max | ⭐ | ⭐⭐⭐⭐⭐ | ❌ | 复杂任务 |
| qwen-turbo-latest | ⭐⭐⭐ | ⭐⭐⭐ | ✅ | 快速+搜索 |
| qwen-plus-latest | ⭐⭐ | ⭐⭐⭐⭐ | ✅ | **推荐** |
| qwen-max-latest | ⭐ | ⭐⭐⭐⭐⭐ | ✅ | 最强能力 |

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + Enter` | 发送消息 |
| `Ctrl/Cmd + N` | 新建对话 |
| `Ctrl/Cmd + K` | 清空当前对话 |
| `Esc` | 隐藏插件窗口 |

## 📚 文档

- [快速开始](QUICKSTART.md) - 5分钟上手指南
- [使用指南](USAGE.md) - 详细功能说明
- [开发文档](DEVELOPMENT.md) - 技术细节和扩展开发
- [Logo 说明](LOGO_README.md) - 图标制作指南

## 🛠️ 技术栈

- **前端**: 原生 HTML/CSS/JavaScript
- **Markdown 渲染**: Marked.js
- **代码高亮**: Highlight.js
- **API**: 阿里云 DashScope (OpenAI 兼容接口)
- **存储**: utools.dbStorage

无需构建工具，开箱即用。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [utools](https://u.tools/) - 优秀的桌面效率工具
- [阿里云通义千问](https://tongyi.aliyun.com/) - 强大的大语言模型
- [Marked.js](https://marked.js.org/) - Markdown 解析库
- [Highlight.js](https://highlightjs.org/) - 代码高亮库

## 📝 更新日志

### v1.0.0 (2024-10-27)

**首次发布** 🎉

- ✅ 完整的 AI 对话功能
- ✅ 网络搜索支持
- ✅ 流式响应渲染
- ✅ 多轮对话历史管理
- ✅ 深色/浅色主题
- ✅ 配置管理界面
- ✅ 数据导入导出
- ✅ Markdown 和代码高亮

---

<div align="center">

**如果觉得有用，请给个 ⭐ Star！**

Made with ❤️ by [gsy]

</div>

