# Use the official Bun.js image
FROM oven/bun

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock tsconfig.json ./

# Install dependencies
RUN bun install

# Copy all source code
COPY . .

# Set environment variables (optional)
ENV NODE_ENV=production

# Command to start the bot
CMD ["bun", "src/index.ts"]