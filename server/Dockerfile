FROM node:20-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

# Create uploads directories
RUN mkdir -p uploads/videos uploads/files

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]
