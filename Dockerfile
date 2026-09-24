FROM node:20-alpine

WORKDIR /app

# Copy package definitions
COPY package*.json ./

# Install dependencies cleanly
RUN npm install --omit=dev

# Copy application files
COPY . .

# Expose server port
EXPOSE 4500

# Set environment
ENV NODE_ENV=production
ENV PORT=4500

# Launch server
CMD ["node", "server.js"]
