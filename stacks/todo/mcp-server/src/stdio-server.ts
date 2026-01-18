#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Simple Vikunja client
class VikunjaClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string, apiToken?: string) {
    this.baseUrl = baseUrl;
    this.token = apiToken;
  }

  async authenticate(username: string, password: string): Promise<void> {
    const response = await axios.post(`${this.baseUrl}/api/v1/login`, {
      username,
      password
    });
    this.token = response.data.token;
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
    await ensureAuthenticated();

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

async function main() {
  // Test connection and authenticate if needed
  try {
    await vikunjaClient.getInfo();
    await ensureAuthenticated();
  } catch (error) {
    // Log to stderr so it doesn't interfere with STDIO transport
    console.error('Warning: Could not connect to Vikunja:', (error as Error).message);
  }

  // Start STDIO transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Keep the process running
  process.stdin.resume();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}