# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package.json and related files
COPY package.json tsconfig.json vite.config.ts postcss.config.js tailwind.config.js index.html ./
# Copy source code
COPY src ./src

# Install dependencies and build
RUN npm install
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
