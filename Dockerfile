# 生产环境容器化部署 Dockerfile
FROM oven/bun:1-alpine AS base
WORKDIR /app

# 1. 复制依赖描述并安装
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# 2. 复制源码
COPY . .

# 3. 构建前端静态资源
RUN bun run build

# 4. 暴露生产端口
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# 5. 启动服务（启动时自动执行数据库迁移与种子检查）
CMD ["bun", "run", "start"]
