# 生产环境单机自托管 Dockerfile
# 一个 Bun 进程同时提供 API 与前端静态资源（src/server/index.ts 的 GET * 兜底）
FROM oven/bun:1-alpine AS base
WORKDIR /app

# 1. 复制依赖描述并安装
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# 2. 复制源码
COPY . .

# 3. 构建前端静态资源
RUN bun run build

# 4. 生产环境参数
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# 5. 启动（启动时自动执行数据库迁移、种子与旧题清理）
CMD ["bun", "run", "start"]
