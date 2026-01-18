# Vikunja MCP Server - AI Agent Context

## Project Purpose & Philosophy

This is a Model Context Protocol (MCP) server that bridges AI assistants with Vikunja, an open-source todo management application. The project enables natural language task management through AI while preserving the rich relationship modeling capabilities of modern project management.

## Core Design Principles

### 1. AI-First Task Management
- **Natural Language Processing**: Users can create tasks using conversational language
- **Intelligent Defaults**: The system assumes users want to see incomplete tasks unless explicitly requested otherwise
- **Contextual Understanding**: AI can understand relationships, priorities, and dependencies in human terms
- **Smart Filtering**: Automatic filtering and organization based on user intent

### 2. Relationship-Centric Architecture
- **Task Hierarchies**: Deep support for parent-child task relationships
- **Dependencies**: Full blocking/dependency relationship modeling
- **Bulk Operations**: Efficient management of task relationships at scale
- **Hierarchy Visualization**: AI can understand and explain complex task structures

### 3. Production-Ready Integration
- **Docker-First Deployment**: Containerized for reliable deployment
- **STDIO Transport**: Seamless integration with Claude Desktop and AI tools
- **Error Resilience**: Comprehensive error handling and graceful degradation
- **Security**: Proper authentication and input validation

## How AI Agents Should Interpret This System

### Task Management Paradigm
When working with this MCP server, AI agents should understand:

1. **Default Behavior**: Always assume users want incomplete tasks unless they explicitly ask for completed ones
2. **Project Context**: Tasks are organized by projects - always consider project scope when filtering
3. **Time Awareness**: Due dates and overdue tasks are critical for prioritization
4. **Relationship Importance**: Task hierarchies and dependencies are first-class concepts

### Natural Language Patterns
AI agents can interpret these user requests naturally:

```
User: "Show me my overdue tasks"
→ get_overdue_tasks()

User: "What do I need to do today?"
→ get_tasks_due_today()

User: "Create a task to review the deployment in project 1, due next Friday"
→ create_task({ title: "Review deployment", project_id: 1, due_date: "2024-02-16T17:00:00Z" })

User: "Move all subtasks from task 123 to task 456"
→ move_child_tasks({ from_parent_id: 123, to_parent_id: 456 })

User: "What's blocking the deployment task?"
→ get_task_relationships({ task_id: 789, relationship_type: "depends" })
```

### Intelligent Task Organization
AI agents should leverage the relationship system for:

1. **Automatic Hierarchies**: When users describe complex projects, create appropriate parent-child relationships
2. **Dependency Detection**: Identify when tasks naturally depend on others and create those relationships
3. **Project Organization**: Group related tasks under appropriate projects
4. **Priority Inference**: Use context clues to assign appropriate priority levels

## Technical Implementation Context

### MCP Protocol Implementation
This server implements the Model Context Protocol using:
- **JSON-RPC 2.0**: Standard protocol for tool communication
- **STDIO Transport**: Direct stdin/stdout communication for Claude Desktop
- **HTTP Transport**: RESTful API for web application integration
- **Rich Schema**: Comprehensive input validation and type safety

### Vikunja API Integration
The server acts as an intelligent proxy to Vikunja's REST API:
- **Authentication Management**: Handles token-based authentication
- **API Optimization**: Efficient querying with proper pagination and filtering
- **Relationship Mapping**: Translates Vikunja's relationship model to AI-friendly concepts
- **Error Translation**: Converts technical errors to user-friendly messages

### Docker Architecture
Designed for cloud-native deployment:
- **Multi-Stage Builds**: Optimized container images
- **Security Hardening**: Non-root execution, minimal attack surface
- **Environment Configuration**: 12-factor app principles
- **Health Checks**: Built-in monitoring and debugging capabilities

## AI Agent Best Practices

### Task Creation Intelligence
When creating tasks, AI agents should:
1. **Infer Project Context**: Use conversation history to determine appropriate project
2. **Set Realistic Due Dates**: Parse natural language dates into proper ISO format
3. **Assign Appropriate Priorities**: Use urgency indicators to set priority levels
4. **Create Hierarchies**: Break complex requests into parent-child task structures

### Relationship Management
AI agents should understand:
1. **Parent-Child Semantics**: Use for task breakdown and project organization
2. **Dependency Logic**: Use "blocks"/"depends" for temporal relationships
3. **Bulk Operations**: Leverage bulk relationship changes for efficiency
4. **Circular Detection**: Be aware of potential circular dependencies

### User Experience Optimization
AI agents should:
1. **Provide Rich Context**: Include due dates, priorities, and relationships in responses
2. **Use Visual Indicators**: Leverage emojis and formatting for task status
3. **Batch Operations**: Group related operations for efficiency
4. **Proactive Suggestions**: Offer relevant follow-up actions

## Error Handling Philosophy

### Graceful Degradation
When things go wrong:
1. **Authentication Errors**: Guide users through credential setup
2. **Network Issues**: Suggest connectivity troubleshooting
3. **API Limits**: Implement intelligent retry and backoff
4. **Data Validation**: Provide clear correction guidance

### User-Friendly Messaging
AI agents should translate technical errors into actionable advice:
- "Task not found" → "I couldn't find that task. Here are similar tasks..."
- "Authentication failed" → "Let's check your Vikunja credentials..."
- "Circular dependency" → "That would create a loop. Here's how to restructure..."

## Future Extension Points

### Planned Enhancements
The architecture supports future additions:
1. **Webhook Integration**: Real-time updates from Vikunja
2. **Calendar Integration**: Due date and scheduling intelligence
3. **Team Collaboration**: Multi-user task assignment and tracking
4. **Analytics**: Task completion patterns and productivity metrics
5. **AI Automation**: Intelligent task creation and organization

### Integration Opportunities
Consider how this server could integrate with:
1. **Calendar Applications**: Automatic due date synchronization
2. **Communication Tools**: Slack/Discord task creation
3. **Development Tools**: GitHub issue integration
4. **Time Tracking**: Automatic time logging
5. **Reporting Systems**: Project progress and analytics

## Operational Considerations

### Performance Characteristics
- **Response Times**: Typically 100-500ms for simple operations
- **Batch Operations**: Efficient bulk relationship management
- **Memory Usage**: Minimal footprint, suitable for container deployment
- **Scalability**: Stateless design supports horizontal scaling

### Security Model
- **Authentication**: Token-based with Vikunja instance
- **Authorization**: Inherits Vikunja's permission system
- **Data Privacy**: No persistent storage, minimal data retention
- **Network Security**: HTTPS recommended for production deployment

### Monitoring & Observability
Built-in capabilities:
- **Health Checks**: Container-native health monitoring
- **Structured Logging**: JSON format for log aggregation
- **Error Tracking**: Detailed error context and stack traces
- **Performance Metrics**: Request timing and success rates

This MCP server represents a bridge between conversational AI and structured task management, enabling natural language interaction with sophisticated project management concepts.