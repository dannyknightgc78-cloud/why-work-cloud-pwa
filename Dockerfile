# ── Single-stage build (keeps all deps so vite middleware is available) ────────
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy dependency manifests first for layer caching
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install ALL dependencies (including devDeps — vite is needed at runtime
# because esbuild bundles it as --packages=external)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build: vite (client) + esbuild (server)
RUN pnpm build

# Expose port
EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
