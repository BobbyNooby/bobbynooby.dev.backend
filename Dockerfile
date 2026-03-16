FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY . .

EXPOSE 3000

CMD ["bun", "run", "main.ts"]
