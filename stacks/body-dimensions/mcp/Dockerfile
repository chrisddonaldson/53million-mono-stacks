FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# MCP usually runs over Stdio, so no EXPOSE needed unless using SSE
CMD ["npm", "start"]
