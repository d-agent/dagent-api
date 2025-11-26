# Use the official Bun image with Debian base
FROM oven/bun:1.1.38

# Install Node.js 22 LTS (required by Prisma 7.0.1+)
# Remove any existing nodejs and install from official binaries
RUN apt-get update && \
    apt-get install -y curl xz-utils && \
    (apt-get remove -y nodejs 2>/dev/null || true) && \
    curl -fsSL https://nodejs.org/dist/v22.12.0/node-v22.12.0-linux-x64.tar.xz -o /tmp/node.tar.xz && \
    tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 && \
    rm /tmp/node.tar.xz && \
    node --version && \
    npm --version && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
# DATABASE_URL is required by prisma.config.ts but not used during generation
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" bunx prisma generate

# Expose port 3002
EXPOSE 3002

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Start the application
CMD ["bun", "run", "db:deploy", "&&", "bun", "run", "src/index.ts"]
