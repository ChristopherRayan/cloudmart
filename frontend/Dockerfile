FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy application
COPY . .

EXPOSE 3000

# Development server
CMD ["npm", "run", "dev"]
