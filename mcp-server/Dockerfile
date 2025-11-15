FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (including dev dependencies for building)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source files
COPY . .

# Build TypeScript
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 8080

# Start server
CMD ["npm", "start"]

