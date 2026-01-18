# Custom Todo App Stack

This directory contains a multi-service Docker stack for a custom todo application with integrated MCP (Model Context Protocol) capabilities and custom components.

## Architecture Overview

This todo app stack consists of multiple Docker services working together:
- **Custom Frontend Dashboard** - React/Vue/Angular frontend interface
- **Custom API** - Backend REST API service
- **MCP Server** - Model Context Protocol server for AI integration
- **Cron Worker** - Background job processing and scheduled tasks
- **Database** - Persistent data storage
- **Additional services** - Cache, message queue, etc.

## Stack Components

### Core Services
- **Frontend Dashboard**: Custom web interface for todo management
- **API Server**: Custom REST API handling business logic
- **MCP Server**: Provides AI/LLM integration capabilities
- **Cron Worker**: Handles scheduled tasks, notifications, and background processing
- **Database**: PostgreSQL/MySQL for data persistence
- **Cache**: Redis for session management and caching

## Directory Structure

```
todo/
├── README.md              # This file
├── docker-compose.yml     # Multi-service container orchestration
├── .env                   # Environment variables
├── frontend/              # Custom dashboard frontend
│   ├── Dockerfile
│   ├── src/
│   └── package.json
├── api/                   # Custom backend API
│   ├── Dockerfile
│   ├── src/
│   └── requirements.txt
├── mcp-server/            # MCP server implementation
│   ├── Dockerfile
│   ├── server.py
│   └── tools/
├── cron-worker/           # Background job processor
│   ├── Dockerfile
│   ├── jobs/
│   └── scheduler.py
├── config/                # Service configurations
├── data/                  # Database and persistent volumes
├── nginx/                 # Reverse proxy configuration
└── scripts/               # Deployment and utility scripts
```

## Prerequisites

- Docker and Docker Compose
- Node.js (for frontend development)
- Python 3.8+ (for API and MCP server)
- Git for version control

## Quick Start

### 1. Clone and Setup

```bash
# Setup environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 2. Build and Run Stack

```bash
# Build all services
docker-compose build

# Start the complete stack
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Development Mode

```bash
# Start with hot-reload for development
docker-compose -f docker-compose.dev.yml up
```

### 4. Access Services

- Frontend Dashboard: http://localhost:3000
- API: http://localhost:8000
- MCP Server: http://localhost:8001
- Database: localhost:5432

## Service Details

### Frontend Dashboard
- Modern web interface built with React/Vue/Angular
- Real-time todo updates via WebSocket
- Integration with MCP server for AI features
- Responsive design for mobile and desktop

### Custom API
- RESTful API handling todo CRUD operations
- User authentication and authorization
- Integration with MCP server for AI-powered features
- Rate limiting and security middleware

### MCP Server
- Model Context Protocol implementation
- AI-powered todo suggestions and automation
- Natural language task creation
- Smart categorization and prioritization

### Cron Worker
- Scheduled task processing
- Email notifications and reminders
- Data cleanup and maintenance
- Report generation and analytics

## Key Features

- **Smart Todo Management**: AI-powered task suggestions and organization
- **Real-time Sync**: Live updates across all connected clients
- **Background Processing**: Automated reminders and recurring tasks
- **API-First Design**: Full REST API with comprehensive documentation
- **Extensible Architecture**: MCP integration for AI capabilities
- **Containerized Deployment**: Easy scaling and maintenance

## Docker Compose Configuration

```yaml
version: '3.8'

services:
  # Custom Frontend Dashboard
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://api:8000
      - REACT_APP_MCP_URL=http://mcp-server:8001
    depends_on:
      - api
    restart: unless-stopped

  # Custom API Server  
  api:
    build: ./api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://todo_user:todo_pass@db:5432/todo_db
      - REDIS_URL=redis://redis:6379
      - MCP_SERVER_URL=http://mcp-server:8001
    depends_on:
      - db
      - redis
    restart: unless-stopped
    volumes:
      - ./api:/app
      - /app/node_modules

  # MCP Server for AI Integration
  mcp-server:
    build: ./mcp-server
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=postgresql://todo_user:todo_pass@db:5432/todo_db
      - API_URL=http://api:8000
    depends_on:
      - db
    restart: unless-stopped
    volumes:
      - ./mcp-server:/app

  # Background Cron Worker
  cron-worker:
    build: ./cron-worker
    environment:
      - DATABASE_URL=postgresql://todo_user:todo_pass@db:5432/todo_db
      - API_URL=http://api:8000
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
      - api
    restart: unless-stopped
    volumes:
      - ./cron-worker:/app

  # Database
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: todo_db
      POSTGRES_USER: todo_user
      POSTGRES_PASSWORD: todo_pass
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - ./data/redis:/data

  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api
      - mcp-server
    restart: unless-stopped
```

## Development Workflow

### Local Development

```bash
# Start database only
docker-compose up db redis -d

# Run services locally for development
cd frontend && npm run dev
cd api && python manage.py runserver
cd mcp-server && python server.py
cd cron-worker && python scheduler.py
```

### Testing

```bash
# Run tests for all services
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Test individual services
cd api && python -m pytest
cd frontend && npm test
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates in place
- [ ] Reverse proxy configured
- [ ] Health checks passing
- [ ] Backup strategy implemented
- [ ] Monitoring and logging setup
- [ ] Security review completed

## Troubleshooting

### Common Issues

**Database connection errors**
- Check connection strings in config
- Verify database service is running
- Check firewall/network connectivity

**Missing file attachments**
- Verify upload directory permissions
- Check file paths in configuration
- Ensure uploads were copied correctly

**Authentication failures**
- Review LDAP/OAuth configuration
- Check certificate validity
- Verify external auth service connectivity

### Logs

```bash
# View application logs
docker-compose logs -f vikunja-api

# View database logs
docker-compose logs -f db

# View nginx logs
docker-compose logs -f nginx
```

## Useful Commands

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up frontend api -d

# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f api

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose down && docker-compose build && docker-compose up -d

# Access database
docker-compose exec db psql -U todo_user todo_db

# Run database migrations
docker-compose exec api python manage.py migrate

# Access Redis CLI
docker-compose exec redis redis-cli

# Scale services
docker-compose up --scale cron-worker=3 -d

# Backup database
docker-compose exec db pg_dump -U todo_user todo_db > backup/$(date +%Y%m%d)_todo.sql
```

## API Endpoints

### Core Todo Operations
- `GET /api/todos` - List all todos
- `POST /api/todos` - Create new todo
- `GET /api/todos/{id}` - Get specific todo
- `PUT /api/todos/{id}` - Update todo
- `DELETE /api/todos/{id}` - Delete todo

### MCP Integration
- `POST /api/mcp/suggest` - Get AI suggestions for todos
- `POST /api/mcp/categorize` - Auto-categorize todos
- `POST /api/mcp/parse` - Parse natural language into todos

### Health Checks
- `GET /health` - API health check
- `GET /mcp/health` - MCP server health check

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://todo_user:todo_pass@localhost:5432/todo_db
REDIS_URL=redis://localhost:6379

# API Configuration
API_SECRET_KEY=your-secret-key
API_DEBUG=false
API_CORS_ORIGINS=http://localhost:3000

# MCP Server
MCP_API_KEY=your-mcp-api-key
MCP_MODEL=gpt-4

# Cron Worker
CRON_ENABLED=true
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=your-email
EMAIL_PASSWORD=your-password
```

## Resources

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

## Support

For issues and questions:
1. Check service logs: `docker-compose logs -f [service-name]`
2. Verify environment configuration
3. Review API documentation at `/api/docs`
4. Check database connectivity and migrations