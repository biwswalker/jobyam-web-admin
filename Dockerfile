# Stage 1: Install dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package.json ./
RUN npm install

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Set environment variables for production build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 3: Production environment
FROM node:20-alpine AS runner
WORKDIR /app

# Copy only production dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy built application
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start"]