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
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
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

// Authentication helper
async function ensureAuthenticated(): Promise<void> {
  if (!vikunjaClient.isAuthenticated() && process.env.VIKUNJA_USERNAME && process.env.VIKUNJA_PASSWORD) {
    await vikunjaClient.authenticate(process.env.VIKUNJA_USERNAME, process.env.VIKUNJA_PASSWORD);
  }
}

// HTTP Server
function startHttpServer() {
  const app = express();
  const port = process.env.PORT || 8603;
  
  app.use(cors());
  app.use(express.json());
  
  // Health check
  app.get('/health', (_req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      authenticated: vikunjaClient.isAuthenticated(),
      version: '1.0.0'
    });
  });

  // Get Vikunja info
  app.get('/api/info', async (_req, res) => {
    try {
      const info = await vikunjaClient.getInfo();
      res.json({ success: true, data: info });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get projects
  app.get('/api/projects', async (_req, res) => {
    try {
      await ensureAuthenticated();
      const projects = await vikunjaClient.getProjects();
      res.json({ success: true, data: projects, count: projects.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get tasks
  app.get('/api/tasks', async (_req, res) => {
    try {
      await ensureAuthenticated();
      const tasks = await vikunjaClient.getTasks();
      res.json({ success: true, data: tasks, count: tasks.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create task
  app.post('/api/tasks', async (req, res) => {
    try {
      await ensureAuthenticated();
      const task = await vikunjaClient.createTask(req.body);
      res.json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Simple MCP protocol simulation
  app.post('/message', async (req, res) => {
    try {
      const { method, params } = req.body;
      
      switch (method) {
        case 'tools/list':
          res.json({
            jsonrpc: '2.0',
            id: req.body.id,
            result: {
              tools: [
                {
                  name: 'get_tasks',
                  description: 'Get all tasks from Vikunja',
                  inputSchema: { type: 'object', properties: {} }
                },
                {
                  name: 'get_projects',
                  description: 'Get all projects from Vikunja',
                  inputSchema: { type: 'object', properties: {} }
                },
                {
                  name: 'create_task',
                  description: 'Create a new task',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      project_id: { type: 'number' }
                    },
                    required: ['title', 'project_id']
                  }
                }
              ]
            }
          });
          break;

        case 'tools/call':
          await ensureAuthenticated();
          const { name, arguments: args } = params;
          let result;

          switch (name) {
            case 'get_tasks':
              const tasks = await vikunjaClient.getTasks();
              result = {
                content: [{
                  type: 'text',
                  text: `Found ${tasks.length} tasks:\n\n${tasks.map((task: any) => 
                    `• ${task.title} (ID: ${task.id})\n  Status: ${task.done ? '✅ Done' : '⏳ Pending'}`
                  ).join('\n')}`
                }]
              };
              break;

            case 'get_projects':
              const projects = await vikunjaClient.getProjects();
              result = {
                content: [{
                  type: 'text',
                  text: `Found ${projects.length} projects:\n\n${projects.map((project: any) => 
                    `• ${project.title} (ID: ${project.id})`
                  ).join('\n')}`
                }]
              };
              break;

            case 'create_task':
              const task = await vikunjaClient.createTask(args);
              result = {
                content: [{
                  type: 'text',
                  text: `✅ Created task: ${task.title} (ID: ${task.id})`
                }]
              };
              break;

            default:
              throw new Error(`Unknown tool: ${name}`);
          }

          res.json({
            jsonrpc: '2.0',
            id: req.body.id,
            result
          });
          break;

        default:
          res.status(400).json({
            jsonrpc: '2.0',
            id: req.body.id,
            error: { code: -32601, message: `Method not found: ${method}` }
          });
      }
    } catch (error: any) {
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body.id,
        error: { code: -32603, message: error.message }
      });
    }
  });

  app.listen(port, () => {
    logger.info(`Vikunja MCP Server running on port ${port}`);
    logger.info(`Health check: http://localhost:${port}/health`);
    logger.info(`MCP endpoint: http://localhost:${port}/message`);
    logger.info(`API endpoints: http://localhost:${port}/api/*`);
  });
}

async function main() {
  try {
    // Test Vikunja connection
    const info = await vikunjaClient.getInfo();
    logger.info('Successfully connected to Vikunja instance:', info.version);
    
    // Initialize authentication if credentials are available
    await ensureAuthenticated();
    
    startHttpServer();
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