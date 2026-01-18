# Quick Docker Test Guide

## 🚀 Launch Docker MCP Server

### Option 1: Automated Test Script (Recommended)
```bash
./test-mcp.sh
```

### Option 2: Manual Docker Commands

#### Step 1: Configure Environment
```bash
cd mcp-server
cp .env.example .env
# Edit .env with your Vikunja credentials
```

#### Step 2: Build and Run
```bash
# Build the image
docker build -t vikunja-mcp-server:test .

# Run with environment variables
docker run -d \
  --name vikunja-mcp-test \
  -p 8603:8603 \
  -e VIKUNJA_BASE_URL=http://vikunja.desktop.chrisd.uk \
  -e VIKUNJA_USERNAME=your-username \
  -e VIKUNJA_PASSWORD=your-password \
  -e PORT=8603 \
  vikunja-mcp-server:test
```

#### Step 3: Test the Server
```bash
# Health check
curl http://localhost:8603/health

# Test MCP endpoint
curl -X POST http://localhost:8603/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

### Option 3: Docker Compose (Easiest)
```bash
cd mcp-server
docker-compose -f docker-compose.test.yml up -d

# Check status
docker-compose -f docker-compose.test.yml ps

# View logs
docker-compose -f docker-compose.test.yml logs -f

# Stop
docker-compose -f docker-compose.test.yml down
```

## 🧪 Testing MCP Functionality

### 1. List Available Tools
```bash
curl -X POST http://localhost:8001/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

### 2. Get Vikunja Info
```bash
curl -X POST http://localhost:8001/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "resources/read",
    "params": {
      "uri": "vikunja://info"
    }
  }'
```

### 3. List Projects
```bash
curl -X POST http://localhost:8001/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_projects"
    }
  }'
```

### 4. Create a Test Task
```bash
curl -X POST http://localhost:8001/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "create_task",
      "arguments": {
        "title": "Test task from MCP",
        "description": "Created via MCP server API",
        "project_id": 1,
        "priority": 2
      }
    }
  }'
```

### 5. Smart Task Creation
```bash
curl -X POST http://localhost:8001/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call",
    "params": {
      "name": "smart_create_task",
      "arguments": {
        "input": "High priority: Review the urgent deployment checklist due tomorrow",
        "project_id": 1
      }
    }
  }'
```

## 🔧 Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker logs vikunja-mcp-test

# Or with docker-compose
docker-compose -f docker-compose.test.yml logs mcp-server
```

**Authentication failing:**
```bash
# Test Vikunja connection directly
curl http://vikunja.desktop.chrisd.uk/api/v1/info

# Check container environment
docker exec vikunja-mcp-test env | grep VIKUNJA
```

**Port already in use:**
```bash
# Check what's using port 8001
lsof -i :8001

# Use different port
docker run -p 8002:8001 ...
```

### Container Management

```bash
# Stop container
docker stop vikunja-mcp-test

# Remove container
docker rm vikunja-mcp-test

# View real-time logs
docker logs -f vikunja-mcp-test

# Access container shell
docker exec -it vikunja-mcp-test /bin/sh

# Check container health
docker inspect vikunja-mcp-test --format='{{.State.Health.Status}}'
```

## ✅ Success Indicators

- Health endpoint returns `{"status": "healthy", "authenticated": true}`
- MCP tools list shows 8 available tools
- Can successfully call `get_projects` and `get_tasks`
- Container health check shows "healthy"

## 🎯 Next Steps After Testing

1. **Integrate with Claude Desktop** - Add MCP server to Claude config
2. **Add to main stack** - Include in main docker-compose.yml
3. **Production deployment** - Use proper secrets management
4. **Monitoring** - Add logging and metrics collection