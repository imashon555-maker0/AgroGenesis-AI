FROM node:20-slim AS base

WORKDIR /app

# Copy dependency files first (for Docker layer caching)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "const http = require('http'); http.get('http://localhost:5173', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })" || exit 1

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
