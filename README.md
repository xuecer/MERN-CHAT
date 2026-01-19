# 💬 MERN 实时聊天室

基于 MERN 全栈技术的现代化实时聊天应用，集成 AI 智能总结功能。

## ✨ 核心亮点

### 🔐 JWT 双令牌鉴权认证

- **短长双令牌机制**：Access Token (15min) + Refresh Token (7d)
- **安全防护**：HttpOnly Cookie 存储 Refresh Token，免疫 XSS 攻击
- **无感续签**：基于 Axios 拦截器的并发刷新策略，解决 Token 过期时的竞态问题

### ⚡ 高性能聊天设计

- **虚拟滚动**：基于 react-virtuoso，仅渲染可视区域消息，大幅降低 DOM 节点数
- **侧边栏优化**：结合 React.memo 与 useCallback 避免无效重渲染
- **智能缓存**：高频更新组件的缓存处理

### 🤖 AI 流式总结（SSE）

- **实时响应**：基于 Server-Sent Events 的流式输出
- **增量渲染**：封装 `addChunkMessage` 实现打字机效果
- **性能优化**：requestAnimationFrame 批量渲染，降低渲染频次（120fps → 40fps）

### 🌐 WebSocket 连接管理

- **动态心跳**：结合 Page Visibility API，页面不可见时降低频率（30s → 60s）
- **智能重连**：指数退避算法优化断线重连
- **输入状态**：基于 Socket.IO 事件的实时输入状态感知，配合节流降低触发频率

### 🎨 交互体验优化

- **加载优化**：通用 Skeleton 组件优化视觉体验
- **实时预览**：FileReader API 实现图片本地即时预览
- **在线状态**：实时显示用户在线/离线状态

---

## 🛠️ 技术栈

**前端**

- React 19 + TypeScript
- Zustand（状态管理）
- TailwindCSS + DaisyUI
- Socket.IO Client
- React-Virtuoso（虚拟滚动）

**后端**

- Node.js + Express 5
- MongoDB + Mongoose
- Socket.IO
- JWT 认证
- Cloudinary（图片存储）

**AI 集成**

- SiliconFlow API（Qwen 模型）
- Server-Sent Events（流式响应）

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- MongoDB
- pnpm（推荐）

### 安装依赖

```bash
# 安装所有依赖（前端+后端）
pnpm install
```

### 环境变量配置

在 `backend/` 目录创建 `.env` 文件：

```bash
NODE_ENV=development
PORT=5001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/chat

# JWT 密钥（使用强随机字符串）
JWT_SECRET=your-jwt-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# Cloudinary（图片存储）
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI API（可选）
SILICONFLOW_API_KEY=your-api-key
```

### 启动开发服务器

```bash
# 启动后端（端口 5001）
cd backend
pnpm dev

# 新终端窗口 - 启动前端（端口 5173）
cd frontend
pnpm dev
```

访问 `http://localhost:5173` 即可使用。

---

## 📦 生产部署

```bash
# 构建前端
pnpm run build

# 启动生产服务器（后端会自动 serve 前端）
pnpm start
```

**推荐部署平台**：Railway / Render

---

## 🎯 核心功能

- ✅ 用户注册/登录（JWT 双令牌认证）
- ✅ 实时私聊（WebSocket）
- ✅ 全局群聊
- ✅ 图片发送（Cloudinary 存储）
- ✅ 在线状态显示
- ✅ 输入状态提示
- ✅ AI 智能总结群聊内容
- ✅ 个人资料编辑
- ✅ 主题切换（29+ DaisyUI 主题）

---

## 📸 功能演示

### 实时聊天

- 支持文字和图片消息
- 实时在线状态
- 虚拟滚动优化长对话性能

### AI 群聊总结

- 流式输出，实时显示
- 打字机效果
- 智能提炼主要话题、活跃讨论、关键结论

---

## 📝 开发笔记

### 性能优化关键点

1. **虚拟滚动**：只渲染可视区域，避免长对话卡顿
2. **RAF 批量渲染**：将流式 chunk 高频更新合并为 40fps
3. **React.memo + useCallback**：避免侧边栏高频更新时的无效渲染
4. **动态心跳**：页面不可见时降低 WebSocket 心跳频率

### 安全设计

1. **HttpOnly Cookie**：Refresh Token 存储，防止 XSS 窃取
2. **Token 并发刷新**：失败队列机制，避免竞态条件
3. **指数退避重连**：避免服务器过载
