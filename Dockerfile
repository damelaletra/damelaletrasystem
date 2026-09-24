FROM node:20-alpine

WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install dependencies cleanly
RUN npm install --omit=dev

# Copy application files
COPY . .

# Set environment
ENV NODE_ENV=production

# Launch server
CMD ["node", "server.js"]
