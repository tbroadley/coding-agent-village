FROM node:20-alpine

WORKDIR /app

# Install Docker CLI for dockerode (optional, for container management)
# Note: In production, you might want to use Docker socket mounting instead
RUN apk add --no-cache docker-cli

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including dev dependencies for building)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]

