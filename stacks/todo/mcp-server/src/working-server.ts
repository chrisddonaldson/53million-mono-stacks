import { Server } from '@modelcontextprotocol/sdk/server/index.js';
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
class VikunjaClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string, apiToken?: string) {
    this.baseUrl = baseUrl;
    this.token = apiToken;
  }

  async authenticate(username: string, password: string): Promise<void> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/v1/login`, {
        username,
        password
      });
      this.token = response.data.token;
      logger.info('Successfully authenticated with Vikunja');
    } catch (error: any) {
      logger.error('Authentication failed:', error.message);
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

  async createTask(taskData: { title: string; description?: string; project_id: number }): Promise<any> {
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
const vikunjaClient = new VikunjaClient(
  process.env.VIKUNJA_BASE_URL || 'http://vikunja.desktop.chrisd.uk',
  process.env.VIKUNJA_API_TOKEN
);

// Create MCP server
const server = new Server(
  {
    name: 'vikunja-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Set tool handlers
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'get_tasks',
      description: 'Retrieve tasks from Vikunja',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'get_projects',
      description: 'Retrieve projects from Vikunja',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'create_task',
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
  ],
}));

server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_tasks': {
        const tasks = await vikunjaClient.getTasks();
        return {
          content: [
            {
              type: 'text',
              text: `Found ${tasks.length} tasks:\n\n${tasks.map((task: any) => 
                `• ${task.title} (ID: ${task.id})\n  Status: ${task.done ? '✅ Done' : '⏳ Pending'}`
              ).join('\n')}`,
            },
          ],
        };
      }

      case 'get_projects': {
        const projects = await vikunjaClient.getProjects();
        return {
          content: [
            {
              type: 'text',
              text: `Found ${projects.length} projects:\n\n${projects.map((project: any) => 
                `• ${project.title} (ID: ${project.id})`
              ).join('\n')}`,
            },
          ],
        };
      }

      case 'create_task': {
        const task = await vikunjaClient.createTask(args as any);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Created task: ${task.title} (ID: ${task.id})`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    logger.error(`Tool ${name} failed:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
    };
  }
});

// Set resource handlers
server.setRequestHandler('resources/list', async () => ({
  resources: [
    {
      uri: 'vikunja://info',
      mimeType: 'application/json',
      name: 'Vikunja instance information',
      description: 'Information about the Vikunja instance',
    },
  ],
}));

server.setRequestHandler('resources/read', async (request) => {
  const { uri } = request.params;

  if (uri === 'vikunja://info') {
    try {
      const info = await vikunjaClient.getInfo();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(info, null, 2),
          },
        ],
      };
    } catch (error: any) {
      throw new Error(`Failed to get Vikunja info: ${error.message}`);
    }
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// Authentication helper
async function ensureAuthenticated(): Promise<void> {
  if (!vikunjaClient.isAuthenticated() && process.env.VIKUNJA_USERNAME && process.env.VIKUNJA_PASSWORD) {
    await vikunjaClient.authenticate(process.env.VIKUNJA_USERNAME, process.env.VIKUNJA_PASSWORD);
  }
}

// HTTP Server for testing
function startHttpServer() {
  const app = express();
  const port = process.env.PORT || 8603;
  
  app.use(cors());
  app.use(express.json());
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      authenticated: vikunjaClient.isAuthenticated()
    });
  });

  // Simple MCP test endpoint
  app.post('/test', async (req, res) => {
    try {
      await ensureAuthenticated();
      const projects = await vikunjaClient.getProjects();
      res.json({ success: true, projects: projects.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  app.listen(port, () => {
    logger.info(`Vikunja MCP Server running on port ${port}`);
    logger.info(`Health check: http://localhost:${port}/health`);
    logger.info(`Test endpoint: http://localhost:${port}/test`);
  });
}

async function main() {
  try {
    // Test Vikunja connection
    const info = await vikunjaClient.getInfo();
    logger.info('Successfully connected to Vikunja instance:', info.version);
    
    // Initialize authentication if credentials are available
    await ensureAuthenticated();
    
    // Start appropriate server based on environment
    const transport = process.env.TRANSPORT_MODE || 'http';
    
    if (transport === 'stdio') {
      const stdio = new StdioServerTransport();
      await server.connect(stdio);
      logger.info('Vikunja MCP Server running on stdio transport');
    } else {
      startHttpServer();
    }
  } catch (error: any) {
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