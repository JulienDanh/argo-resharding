FROM node:18-alpine
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose port if needed
EXPOSE 3000

CMD ["node", "dist/es-operator.js"] 
