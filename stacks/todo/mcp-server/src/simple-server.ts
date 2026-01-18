import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import winston from 'winston';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

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

// Simple Vikunja client
class SimpleVikunjaClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string, username?: string, password?: string, apiToken?: string) {
    this.baseUrl = baseUrl;
    if (apiToken) {
      this.token = apiToken;
    }
  }

  async authenticate(username: string, password: string): Promise<void> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/login`, {
        username,
        password
      });
      this.token = response.data.token;
      logger.info('Successfully authenticated with Vikunja');
    } catch (error) {
      logger.error('Authentication failed:', error);
      throw new Error('Failed to authenticate');
    }
  }

  async getInfo(): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/api/v1/info`);
    return response.data;
  }

  async getTasks(): Promise<any[]> {
    if (!this.token) throw new Error('Not authenticated');
    
    const response = await axios.get(`${this.baseUrl}/api/v1/tasks/all`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return Array.isArray(response.data) ? response.data : [];
  }

  async getProjects(): Promise<any[]> {
    if (!this.token) throw new Error('Not authenticated');
    
    const response = await axios.get(`${this.baseUrl}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return Array.isArray(response.data) ? response.data : [];
  }

  async createTask(taskData: any): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    
    const response = await axios.put(`${this.baseUrl}/api/v1/projects/${taskData.project_id}`, taskData, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

// Initialize Vikunja client
const vikunjaClient = new SimpleVikunjaClient(
  process.env.VIKUNJA_BASE_URL || 'http://vikunja.desktop.chrisd.uk',
  process.env.VIKUNJA_USERNAME,
  process.env.VIKUNJA_PASSWORD,
  process.env.VIKUNJA_API_TOKEN
);

// Create MCP server
const server = new McpServer({
  name: 'vikunja-mcp-server',
  version: '1.0.0',
});

// Register tools with simpler schemas
server.registerTool(
  'get_tasks',
  {
    description: 'Retrieve tasks from Vikunja',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  async () => {
    try {
      const tasks = await vikunjaClient.getTasks();
      return {
        content: [
          {
            type: 'text',
            text: `Found ${tasks.length} tasks:\n\n${tasks.map((task: any) => 
              `• ${task.title} (ID: ${task.id})\n  Status: ${task.done ? '✅ Done' : '⏳ Pending'}`
            ).join('\n')}`
          }
        ]
      };
    } catch (error) {
      logger.error('Failed to get tasks:', error);
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
      };
    }
  }
);

server.registerTool(
  'get_projects',
  {
    description: 'Retrieve projects from Vikunja',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  async () => {
    try {
      const projects = await vikunjaClient.getProjects();
      return {
        content: [
          {
            type: 'text',
            text: `Found ${projects.length} projects:\n\n${projects.map((project: any) => 
              `• ${project.title} (ID: ${project.id})`
            ).join('\n')}`
          }
        ]
      };
    } catch (error) {
      logger.error('Failed to get projects:', error);
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
      };
    }
  }
);

server.registerTool(
  'create_task',
  {
    description: 'Create a new task in Vikunja',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        project_id: { type: 'number', description: 'Project ID' },
      },
      required: ['title', 'project_id'],
    },
  },
  async (args: any) => {
    try {
      const task = await vikunjaClient.createTask(args);
      return {
        content: [
          {
            type: 'text',
            text: `✅ Created task: ${task.title} (ID: ${task.id})`
          }
        ]
      };
    } catch (error) {
      logger.error('Failed to create task:', error);
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
      };
    }
  }
);

// Register resource
server.registerResource(
  'vikunja://info',
  {
    description: 'Vikunja instance information',
    mimeType: 'application/json',
  },
  async () => {
    try {
      const info = await vikunjaClient.getInfo();
      return {
        content: [{ type: 'text', text: JSON.stringify(info, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }]
      };
    }
  }
);

// Authentication helper
async function ensureAuthenticated(): Promise<void> {
  if (!vikunjaClient.isAuthenticated() && process.env.VIKUNJA_USERNAME && process.env.VIKUNJA_PASSWORD) {
    await vikunjaClient.authenticate(process.env.VIKUNJA_USERNAME, process.env.VIKUNJA_PASSWORD);
  }
}

// HTTP Server setup
async function setupHttpServer() {
  const app = express();
  const port = process.env.PORT || 8603;
  
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
  const transport = new SSEServerTransport('/message');
  await server.connect(transport);
  
  app.use('/message', (req, res, next) => {
    if (req.method === 'POST') {
      transport.handleRequest(req, res);
    } else {
      next();
    }
  });
  
  app.listen(port, () => {
    logger.info(`Vikunja MCP Server running on port ${port}`);
    logger.info(`Health check: http://localhost:${port}/health`);
    logger.info(`MCP endpoint: http://localhost:${port}/message`);
  });
}

async function main() {
  try {
    // Test Vikunja connection
    await vikunjaClient.getInfo();
    logger.info('Successfully connected to Vikunja instance');
    
    // Initialize authentication if credentials are available
    await ensureAuthenticated();
    
    // Start appropriate server based on environment
    const transport = process.env.TRANSPORT_MODE || 'http';
    
    if (transport === 'stdio') {
      const stdioTransport = new StdioServerTransport();
      await server.connect(stdioTransport);
      logger.info('Vikunja MCP Server running on stdio transport');
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