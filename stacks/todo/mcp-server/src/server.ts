import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import winston from 'winston';
import express from 'express';
import cors from 'cors';
import { VikunjaClient } from './clients/vikunja.js';
import {
  CreateTaskRequestSchema,
  UpdateTaskRequestSchema,
  CreateProjectRequestSchema,
  PRIORITY_LEVELS,
  PRIORITY_NAMES,
} from './types/vikunja.js';

// Load environment variables
dotenv.config();

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize Vikunja client
const vikunjaClient = new VikunjaClient(
  process.env.VIKUNJA_BASE_URL || 'http://vikunja.desktop.chrisd.uk',
  process.env.VIKUNJA_USERNAME,
  process.env.VIKUNJA_PASSWORD,
  process.env.VIKUNJA_API_TOKEN,
  logger
);

// Create MCP server
const server = new McpServer({
  name: 'vikunja-mcp-server',
  version: '1.0.0',
});

// === TOOLS ===

// Task Management Tools
server.registerTool('get_tasks', {
  description: 'Retrieve tasks from Vikunja, optionally filtered by project',
  inputSchema: {
    type: 'object',
    properties: {
      project_id: {
        type: 'number',
        description: 'Optional project ID to filter tasks'
      },
      page: {
        type: 'number',
        default: 1,
        description: 'Page number for pagination'
      },
      per_page: {
        type: 'number',
        default: 50,
        description: 'Number of tasks per page'
      }
    }
  }
}, async ({ project_id, page = 1, per_page = 50 }) => {
  try {
    await ensureAuthenticated();
    const tasks = await vikunjaClient.getTasks(project_id, page, per_page);
    
    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      done: task.done,
      priority: `${task.priority} (${PRIORITY_NAMES[task.priority] || 'Unknown'})`,
      due_date: task.due_date,
      project_id: task.project_id,
      created: task.created,
      updated: task.updated
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${tasks.length} tasks:\n\n${formattedTasks.map(task => 
            `• **${task.title}** (ID: ${task.id})\n` +
            `  Status: ${task.done ? '✅ Done' : '⏳ Pending'}\n` +
            `  Priority: ${task.priority}\n` +
            `  Project: ${task.project_id}\n` +
            (task.description ? `  Description: ${task.description}\n` : '') +
            (task.due_date ? `  Due: ${task.due_date}\n` : '') +
            `  Updated: ${task.updated}\n`
          ).join('\n')}`
        }
      ]
    };
  } catch (error) {
    logger.error('Failed to get tasks:', error);
    return {
      content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
});

server.registerTool('create_task', {
  description: 'Create a new task in Vikunja',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Task title' },
      description: { type: 'string', description: 'Task description' },
      project_id: { type: 'number', description: 'Project ID where the task will be created' },
      priority: { 
        type: 'number', 
        minimum: 0, 
        maximum: 5, 
        description: 'Priority level (0=Unset, 1=Low, 2=Medium, 3=High, 4=Urgent, 5=Critical)' 
      },
      due_date: { type: 'string', description: 'Due date in ISO format (YYYY-MM-DDTHH:mm:ssZ)' },
      start_date: { type: 'string', description: 'Start date in ISO format' },
      end_date: { type: 'string', description: 'End date in ISO format' }
    },
    required: ['title', 'project_id']
  }
}, async (input) => {
  try {
    await ensureAuthenticated();
    const taskData = CreateTaskRequestSchema.parse(input);
    const task = await vikunjaClient.createTask(taskData);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Created task successfully!\n\n` +
                `**${task.title}** (ID: ${task.id})\n` +
                `Description: ${task.description || 'None'}\n` +
                `Priority: ${task.priority} (${PRIORITY_NAMES[task.priority]})\n` +
                `Project: ${task.project_id}\n` +
                `Created: ${task.created}`
        }
      ]
    };
  } catch (error) {
    logger.error('Failed to create task:', error);
    return {
      content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
});

server.registerTool('update_task', {
  description: 'Update an existing task in Vikunja',
  inputSchema: {
    type: 'object',
    properties: {
      task_id: { type: 'number', description: 'ID of the task to update' },
      title: { type: 'string', description: 'New task title' },
      description: { type: 'string', description: 'New task description' },
      done: { type: 'boolean', description: 'Mark task as done/undone' },
      priority: { 
        type: 'number', 
        minimum: 0, 
        maximum: 5, 
        description: 'Priority level (0=Unset, 1=Low, 2=Medium, 3=High, 4=Urgent, 5=Critical)' 
      },
      due_date: { type: 'string', description: 'Due date in ISO format' },
      project_id: { type: 'number', description: 'Move task to different project' }
    },
    required: ['task_id']
  }
}, async ({ task_id, ...updates }) => {
  try {
    await ensureAuthenticated();
    const updateData = UpdateTaskRequestSchema.parse(updates);
    const task = await vikunjaClient.updateTask(task_id, updateData);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Updated task successfully!\n\n` +
                `**${task.title}** (ID: ${task.id})\n` +
                `Status: ${task.done ? '✅ Done' : '⏳ Pending'}\n` +
                `Priority: ${task.priority} (${PRIORITY_NAMES[task.priority]})\n` +
                `Updated: ${task.updated}`
        }
      ]
    };
  } catch (error) {
    logger.error('Failed to update task:', error);
    return {
      content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
});

server.registerTool('delete_task', {
  description: 'Delete a task from Vikunja',
  inputSchema: {
    type: 'object',
    properties: {
      task_id: { type: 'number', description: 'ID of the task to delete' }
    },
    required: ['task_id']
  }
}, async ({ task_id }) => {
  try {
    await ensureAuthenticated();
    await vikunjaClient.deleteTask(task_id);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Task ${task_id} deleted successfully!`
        }
      ]
    };
  } catch (error) {
    logger.error('Failed to delete task:', error);
    return {
      content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
});

// Project Management Tools
server.registerTool('get_projects', {
  description: 'Retrieve all projects from Vikunja',
  inputSchema: {
    type: 'object',
    properties: {
      page: { type: 'number', default: 1, description: 'Page number for pagination' },
      per_page: { type: 'number', default: 50, description: 'Number of projects per page' }
    }
  }
}, async ({ page = 1, per_page = 50 }) => {
  try {
    await ensureAuthenticated();
    const projects = await vikunjaClient.getProjects(page, per_page);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${projects.length} projects:\n\n${projects.map(project => 
            `• **${project.title}** (ID: ${project.id})\n` +
            `  Description: ${project.description || 'None'}\n` +
            `  Tasks: ${project.tasks.length}\n` +
            `  Owner: ${project.owner.username}\n` +
            `  Created: ${project.created}\n`
          ).join('\n')}`
        }
      ]
    };
  } catch (error) {
    logger.error('Failed to get projects:', error);
    return {
      content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
});

server.registerTool('create_project', {
  description: 'Create a new project in Vikunja',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Project title' },
      description: { type: 'string', description: 'Project description' },
      hex_color: { type: 'string', description: 'Project color in hex format (e.g., #FF0000)' }
    },
    required: ['title']
  }
}, async (input) => {
  try {
    await ensureAuthenticated();
    const projectData = CreateProjectRequestSchema.parse(input);
    const project = await vikunjaClient.createProject(projectData);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Created project successfully!\n\n` +
                `**${project.title}** (ID: ${project.id})\n` +
                `Description: ${project.description || 'None'}\n` +
                `Color: ${project.hex_color}\n` +
                `Created: ${project.created}`
        }
      ]
    };
  } catch (error) {
    logger.error('Failed to create project:', error);
    return {
      content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
});

// Search and AI Tools
server.registerTool('search_tasks', {
  description: 'Search for tasks by title or description',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      project_id: { type: 'number', description: 'Optional project ID to limit search' }
    },
    required: ['query']
  }
}, async ({ query, project_id }) => {
  try {
    await ensureAuthenticated();
    const tasks = await vikunjaClient.searchTasks(query, project_id);
    
    if (tasks.length === 0) {
      return {
        content: [{ type: 'text' as const, text: `No tasks found for query: "${query}"` }]
      };
    }
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${tasks.length} tasks matching "${query}":\n\n${tasks.map(task => 
            `• **${task.title}** (ID: ${task.id})\n` +
            `  Description: ${task.description || 'None'}\n` +
            `  Status: ${task.done ? '✅ Done' : '⏳ Pending'}\n` +
            `  Priority: ${PRIORITY_NAMES[task.priority]}\n` +
            `  Project: ${task.project_id}\n`
          ).join('\n')}`
        }
      ]
    };
  } catch (error) {
    logger.error('Failed to search tasks:', error);
    return {
      content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
});

server.registerTool('smart_create_task', {
  description: 'Create a task using natural language input with AI parsing',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'Natural language description of the task' },
      project_id: { type: 'number', description: 'Project ID where the task will be created' }
    },
    required: ['input', 'project_id']
  }
}, async ({ input, project_id }) => {
  try {
    await ensureAuthenticated();
    
    // Simple AI parsing logic (can be enhanced with real AI/LLM integration)
    const priorityKeywords = {
      urgent: PRIORITY_LEVELS.URGENT,
      critical: PRIORITY_LEVELS.CRITICAL,
      high: PRIORITY_LEVELS.HIGH,
      important: PRIORITY_LEVELS.HIGH,
      medium: PRIORITY_LEVELS.MEDIUM,
      low: PRIORITY_LEVELS.LOW,
    };
    
    let priority = PRIORITY_LEVELS.MEDIUM;
    let title = input;
    let description = '';
    
    // Extract priority from keywords
    for (const [keyword, level] of Object.entries(priorityKeywords)) {
      if (input.toLowerCase().includes(keyword)) {
        priority = level;
        break;
      }
    }
    
    // Try to extract title and description
    const sentences = input.split('.').map(s => s.trim()).filter(s => s.length > 0);
    if (sentences.length > 1) {
      title = sentences[0];
      description = sentences.slice(1).join('. ');
    }
    
    // Extract due date (simple regex for "due tomorrow", "due next week", etc.)
    let due_date: string | undefined;
    const dateMatches = input.match(/(due\s+)?(tomorrow|today|next week|next month)/i);
    if (dateMatches) {
      const datePhrase = dateMatches[2].toLowerCase();
      const now = new Date();
      
      switch (datePhrase) {
        case 'today':
          due_date = now.toISOString();
          break;
        case 'tomorrow':
          now.setDate(now.getDate() + 1);
          due_date = now.toISOString();
          break;
        case 'next week':
          now.setDate(now.getDate() + 7);
          due_date = now.toISOString();
          break;
        case 'next month':
          now.setMonth(now.getMonth() + 1);
          due_date = now.toISOString();
          break;
      }
    }
    
    const taskData = CreateTaskRequestSchema.parse({
      title,
      description,
      project_id,
      priority,
      due_date
    });
    
    const task = await vikunjaClient.createTask(taskData);
    
    return {
      content: [
        {
          type: 'text' as const,
          text: `✅ Smart-created task from: "${input}"\n\n` +
                `**${task.title}** (ID: ${task.id})\n` +
                `Description: ${task.description || 'None'}\n` +
                `Priority: ${task.priority} (${PRIORITY_NAMES[task.priority]})\n` +
                `Project: ${task.project_id}\n` +
                (due_date ? `Due: ${due_date}\n` : '') +
                `Created: ${task.created}`
        }
      ]
    };
  } catch (error) {
    logger.error('Failed to smart create task:', error);
    return {
      content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
});

// === RESOURCES ===

server.registerResource('vikunja://info', {
  description: 'Vikunja instance information and capabilities',
  mimeType: 'application/json'
}, async () => {
  try {
    const info = await vikunjaClient.getInfo();
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(info, null, 2) }]
    };
  } catch (error) {
    logger.error('Failed to get Vikunja info:', error);
    return {
      content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
});

server.registerResource('vikunja://projects', {
  description: 'All projects in Vikunja',
  mimeType: 'application/json'
}, async () => {
  try {
    await ensureAuthenticated();
    const projects = await vikunjaClient.getProjects();
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(projects, null, 2) }]
    };
  } catch (error) {
    logger.error('Failed to get projects resource:', error);
    return {
      content: [{ type: 'text' as const, text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
    };
  }
});

// === PROMPTS ===

server.registerPrompt('task_creation_assistant', {
  description: 'Helps create well-structured tasks with appropriate priorities and descriptions',
  arguments: [
    { name: 'task_description', description: 'Natural language description of what needs to be done' },
    { name: 'project_context', description: 'Information about the project this task belongs to' }
  ]
}, async ({ task_description, project_context }) => {
  return {
    messages: [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Please help me create a well-structured task based on this description: "${task_description}"

Project context: ${project_context}

Please suggest:
1. A clear, actionable title
2. A detailed description with acceptance criteria
3. An appropriate priority level (0-5)
4. Any relevant due dates or milestones
5. Whether this should be broken down into smaller sub-tasks

Format your response as a structured task that can be easily created in Vikunja.`
        }
      }
    ]
  };
});

// === UTILITY FUNCTIONS ===

async function ensureAuthenticated(): Promise<void> {
  if (!vikunjaClient.isAuthenticated()) {
    await vikunjaClient.authenticate();
  }
}

// === SERVER SETUP ===

async function setupHttpServer() {
  const app = express();
  const port = process.env.PORT || 8603;
  
  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }));
  app.use(express.json());
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      authenticated: vikunjaClient.isAuthenticated()
    });
  });
  
  // MCP SSE endpoint
  const transport = new SSEServerTransport('/message', res => res);
  await server.connect(transport);
  
  app.use('/message', transport.handleRequest.bind(transport));
  
  app.listen(port, () => {
    logger.info(`Vikunja MCP Server running on port ${port}`);
    logger.info(`Health check: http://localhost:${port}/health`);
    logger.info(`MCP endpoint: http://localhost:${port}/message`);
  });
}

async function setupStdioServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Vikunja MCP Server running on stdio transport');
}

async function main() {
  try {
    // Test Vikunja connection
    await vikunjaClient.getInfo();
    logger.info('Successfully connected to Vikunja instance');
    
    // Initialize authentication if credentials are available
    if (process.env.VIKUNJA_USERNAME && process.env.VIKUNJA_PASSWORD) {
      await vikunjaClient.authenticate();
      logger.info('Successfully authenticated with Vikunja');
    }
    
    // Start appropriate server based on environment
    const transport = process.env.TRANSPORT_MODE || 'http';
    
    if (transport === 'stdio') {
      await setupStdioServer();
    } else {
      await setupHttpServer();
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}