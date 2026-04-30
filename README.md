# 电摩跨境物流平台 (Contact UI)

基于 React + TypeScript + Vite 的跨境物流管理平台。

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 6
- Ant Design 5
- TailwindCSS 3
- Zustand (状态管理)
- react-i18next (国际化: 中文/English/বাংলা)
- React Router v6
- recharts (图表)
- Axios (HTTP 客户端)

### 后端
- Express.js + TypeScript
- PostgreSQL 15+
- Redis 7+
- JWT 认证
- Zod 请求验证

## 快速开始

### 1. 启动基础设施 (PostgreSQL + Redis)

```bash
docker compose up -d
```

### 2. 初始化数据库

```bash
psql -h localhost -U postgres -d logistics -f server/migrations/001_init.sql
```

### 3. 启动后端

```bash
cd server
npm install
npx tsx src/index.ts
```

后端运行在 http://localhost:8080

### 4. 启动前端

```bash
npm install
npm run dev
```

前端运行在 http://localhost:3000

## 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。
