# Vikunja MCP Server

A comprehensive Model Context Protocol (MCP) server that provides AI integration capabilities for Vikunja todo management. This server enables AI assistants to interact with your Vikunja instance through a standardized protocol with advanced task management, filtering, and relationship features.

## 🚀 Features Overview

### Core Task Management
- **Full CRUD Operations**: Create, read, update, delete tasks with rich metadata
- **Advanced Filtering**: Filter by project, completion status, due dates, priority
- **Smart Defaults**: Automatically shows incomplete tasks unless specified otherwise
- **Search Capabilities**: Find tasks by title, description, or keywords
- **Project Management**: List and create projects, organize tasks by project

### Task Relationships & Dependencies
- **Parent-Child Hierarchies**: Create and manage task/subtask relationships
- **Task Dependencies**: Set up blocking relationships and dependencies
- **Relationship Types**: Support for parent, child, blocks, depends, duplicate, related
- **Bulk Operations**: Move all children from one parent to another
- **Hierarchy Visualization**: Get complete task trees with nested children
- **Orphaned Task Detection**: Find tasks without parent relationships
- **Blocked Task Identification**: Identify tasks waiting on dependencies

### Time Management
- **Due Date Filtering**: Find tasks due within specific date ranges
- **Overdue Detection**: Automatically identify overdue tasks with days overdue
- **Today's Tasks**: Quick access to tasks due today
- **Priority Support**: Set and filter by task priority levels (0-5)

### AI-Powered Features
- **Natural Language Processing**: Smart task creation from natural language
- **Intelligent Defaults**: Sensible defaults for incomplete tasks and sorting
- **Rich Formatting**: Detailed task information with status, dates, priorities
- **Relationship Intelligence**: Understanding of task hierarchies and dependencies

## 🔧 Available MCP Tools

### Basic Task Operations
- `get_tasks` - Retrieve tasks with advanced filtering (defaults to incomplete)
- `get_projects` - List all available projects
- `create_task` - Create new tasks with metadata (title, description, due date, priority)
- `update_task` - Modify existing tasks (title, description, completion, dates, priority)
- `search_tasks` - Search tasks by keywords with optional project filtering

### Advanced Task Queries
- `get_tasks_by_project` - Get all tasks for a specific project
- `get_overdue_tasks` - Find overdue tasks with overdue duration
- `get_tasks_due_today` - Quick access to today's tasks
- `get_orphaned_tasks` - Find tasks without parent relationships
- `get_blocked_tasks` - Identify tasks blocked by incomplete dependencies

### Task Relationship Management
- `get_task_relationships` - Get all relationships for a specific task
- `get_child_tasks` - List all subtasks of a parent task
- `create_task_relationship` - Create relationships between tasks
- `remove_task_relationship` - Remove existing task relationships
- `move_child_tasks` - Bulk move children from one parent to another
- `set_task_parent` - Set or change the parent of a task
- `get_task_hierarchy` - Get complete task tree with nested children

### Information Resources
- `vikunja://info` - Vikunja instance information and capabilities

## 📋 Installation & Setup

### Prerequisites
- Docker or Node.js 20+
- Access to a Vikunja instance
- Vikunja API credentials (username/password or API token)

### Quick Docker Setup ✅ VERIFIED WORKING

```bash
# Build the STDIO-compatible image
docker build -f Dockerfile.stdio -t vikunja-mcp-server:stdio .

# Test the server
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | \
docker run -i --rm \
  -e VIKUNJA_BASE_URL=http://vikunja.desktop.chrisd.uk \
  -e VIKUNJA_API_TOKEN=your-token \
  vikunja-mcp-server:stdio
```

### Claude Desktop Integration

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "vikunja": {
      "enabled": true,
      "type": "local",
      "command": [
        "docker",
        "run",
        "-i",
        "--rm",
        "-e",
        "VIKUNJA_BASE_URL=http://vikunja.desktop.chrisd.uk",
        "-e",
        "VIKUNJA_API_TOKEN=your-api-token",
        "vikunja-mcp-server:stdio"
      ]
    }
  }
}
```

### Environment Configuration

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VIKUNJA_BASE_URL` | Your Vikunja instance URL | Yes | `http://vikunja.desktop.chrisd.uk` |
| `VIKUNJA_USERNAME` | Username for authentication | No* | `your-username` |
| `VIKUNJA_PASSWORD` | Password for authentication | No* | `your-password` |
| `VIKUNJA_API_TOKEN` | API token (preferred) | No* | `tk_xxx...` |
| `LOG_LEVEL` | Logging verbosity | No | `info` |

*Either username/password OR API token is required.

## 🎯 Usage Examples

### Basic Task Management

```typescript
// Get incomplete tasks (default behavior)
get_tasks()

// Get all tasks including completed
get_tasks({ completed: true })

// Get tasks for specific project
get_tasks({ project_id: 1, completed: false })

// Create a task with due date and priority
create_task({
  title: "Review deployment checklist",
  description: "Complete final review before production",
  project_id: 1,
  due_date: "2024-02-15T10:00:00Z",
  priority: 3
})
```

### Advanced Filtering

```typescript
// Find overdue tasks
get_overdue_tasks({ project_id: 1 })

// Get tasks due today
get_tasks_due_today()

// Search across projects
search_tasks({ query: "authentication", project_id: 1 })

// Filter by date range
get_tasks({
  due_date_from: "2024-02-01",
  due_date_to: "2024-02-29",
  completed: false
})
```

### Task Relationship Management

```typescript
// Get all child tasks
get_child_tasks({ parent_task_id: 123 })

// Create parent-child relationship
create_task_relationship({
  from_task_id: 456,
  to_task_id: 123,
  relationship_type: "parent"
})

// Move all children to new parent
move_child_tasks({
  from_parent_id: 123,
  to_parent_id: 789
})

// Get complete task hierarchy
get_task_hierarchy({ root_task_id: 123, max_depth: 3 })

// Find orphaned tasks
get_orphaned_tasks({ project_id: 1 })

// Identify blocked tasks
get_blocked_tasks()
```

### Dependency Management

```typescript
// Create dependency (Task A blocks Task B)
create_task_relationship({
  from_task_id: 123,
  to_task_id: 456,
  relationship_type: "blocks"
})

// Get all relationships for a task
get_task_relationships({ task_id: 123 })

// Get only dependencies
get_task_relationships({ 
  task_id: 123, 
  relationship_type: "depends" 
})
```

## 🏗️ Architecture

### Docker Images
- **`vikunja-mcp-server:stdio`** - STDIO transport for Claude Desktop integration
- **`vikunja-mcp-server:test`** - HTTP transport for testing and web integration

### Transport Support
- **STDIO Transport** - For Claude Desktop and local AI applications
- **HTTP Transport** - For web applications and API testing

### Security Features
- Environment-based configuration
- API token authentication (recommended)
- Input validation and error handling
- Non-root container execution

## 🔍 Relationship Types Supported

| Type | Description | Example Use Case |
|------|-------------|------------------|
| `parent` | Parent-child hierarchy | Main task → Subtasks |
| `child` | Reverse parent relationship | Subtask → Parent task |
| `blocks` | Blocking dependency | Task A must finish before Task B |
| `depends` | Dependency relationship | Task B depends on Task A |
| `related` | General association | Related features or tasks |
| `duplicate` | Duplicate tasks | Mark tasks as duplicates |

## 🧪 Testing & Debugging

### Manual Testing

```bash
# Test basic connectivity
curl http://localhost:8603/health

# Test Vikunja connection
curl http://localhost:8603/api/info

# Test MCP protocol
curl -X POST http://localhost:8603/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'
```

### Common Operations

```bash
# View logs
docker logs vikunja-mcp-server

# Debug with verbose logging
docker run -e LOG_LEVEL=debug vikunja-mcp-server:stdio

# Interactive testing
docker run -it --rm vikunja-mcp-server:stdio /bin/sh
```

## 📈 Performance Considerations

- **Pagination**: Default 50 tasks per request, configurable
- **Relationship Depth**: Default max depth 3 for hierarchies
- **Caching**: No built-in caching (relies on Vikunja's performance)
- **Rate Limiting**: Respects Vikunja API limits
- **Async Operations**: All database operations are asynchronous

## 🚨 Error Handling

- **Authentication Errors**: Clear error messages for invalid credentials
- **Network Issues**: Timeout handling and connection retry logic
- **API Rate Limits**: Graceful handling of Vikunja API limits
- **Data Validation**: Input validation using schemas
- **Relationship Errors**: Detailed error messages for relationship operations

## 🔮 Advanced Use Cases

### Project Migration
```typescript
// Move all incomplete tasks from Project A to Project B
const tasks = await get_tasks({ project_id: 1, completed: false });
for (const task of tasks) {
  await update_task({ task_id: task.id, project_id: 2 });
}
```

### Dependency Cleanup
```typescript
// Find and resolve circular dependencies
const blockedTasks = await get_blocked_tasks();
// Analyze and break circular dependencies
```

### Hierarchy Restructuring
```typescript
// Reorganize task hierarchies
await move_child_tasks({ from_parent_id: 123, to_parent_id: 456 });
```

## 📚 Integration Patterns

### With Claude Desktop
- Natural language task creation
- Intelligent task organization
- Automated relationship management
- Smart filtering and search

### With Other AI Tools
- RESTful API for web applications
- JSON-RPC protocol for custom clients
- Webhooks for real-time updates (future)

## 🛠️ Development

### Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run development server
npm run dev

# Run tests
npm test
```

### Docker Development

```bash
# Build images
docker build -t vikunja-mcp-server:test .
docker build -f Dockerfile.stdio -t vikunja-mcp-server:stdio .

# Development with hot reload
npm run dev
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with comprehensive tests
4. Submit pull request with detailed description

## 📞 Support

For issues and questions:
1. Check server logs: `docker logs container-name`
2. Verify Vikunja connectivity: `curl your-vikunja-url/api/v1/info`
3. Test MCP protocol: Use provided test commands
4. Review environment configuration
5. Check Claude Desktop configuration syntax