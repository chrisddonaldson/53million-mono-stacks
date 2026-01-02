# Build stage
FROM node:22-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Default nginx config is usually fine for a single page app if we don't need routing
# But for Solid Router, we might need a custom config to redirect 404 to index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
