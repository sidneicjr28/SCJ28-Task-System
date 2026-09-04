FROM node:22-alpine

# Install build tools required for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy app files
COPY . .

# Default environment variables
ENV PORT=2800
ENV NODE_ENV=production

EXPOSE 2800

CMD ["node", "server.js"]
