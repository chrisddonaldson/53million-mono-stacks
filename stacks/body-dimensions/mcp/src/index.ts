import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import pino from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });
const API_URL = process.env.API_URL || 'http://api:3000';

const server = new Server(
  {
    name: 'body-dimensions-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * Resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'body://entries/latest',
      name: 'Latest Body Measurements',
      mimeType: 'application/json',
      description: 'The most recent weight, body fat, and circumference measurements.',
    },
    {
      uri: 'body://reports/weekly',
      name: 'Weekly Trend Report',
      mimeType: 'application/json',
      description: 'Aggregated weekly trends (min/max/avg).',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  if (uri === 'body://entries/latest') {
    const resp = await fetch(`${API_URL}/entries/latest`);
    const data = await resp.json();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
      }],
    };
  }

  if (uri === 'body://reports/weekly') {
    const resp = await fetch(`${API_URL}/reports/trends?period=weekly&type=range`);
    const data = await resp.json();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2),
      }],
    };
  }

  throw new Error(`Resource not found: ${uri}`);
});

/**
 * Tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'log_entry',
      description: 'Submit new body measurement data (partial or full)',
      inputSchema: {
        type: 'object',
        properties: {
          weightKg: { type: 'number' },
          bodyFatPercent: { type: 'number' },
          heightCm: { type: 'number' },
          notes: { type: 'string' },
          skinfolds: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                site: { type: 'string' },
                mm: { type: 'number' }
              }
            }
          },
          circumferences: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                site: { type: 'string' },
                cm: { type: 'number' }
              }
            }
          }
        }
      },
    },
    {
      name: 'get_latest_metrics',
      description: 'Query the most recent body stats',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'analyze_trends',
      description: 'Get a summary of progress over a period',
      inputSchema: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['daily', 'weekly'], default: 'weekly' }
        }
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'log_entry': {
      const resp = await fetch(`${API_URL}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      const data = await resp.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    case 'get_latest_metrics': {
      const resp = await fetch(`${API_URL}/entries/latest`);
      const data = await resp.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    case 'analyze_trends': {
      const period = (args as any)?.period || 'weekly';
      const resp = await fetch(`${API_URL}/reports/trends?period=${period}&type=range`);
      const data = await resp.json();
      return {
        content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      };
    }

    default:
      throw new Error(`Tool not found: ${name}`);
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Body Dimensions MCP server started on stdio');
}

run().catch((error) => {
  logger.error('Fatal error in MCP server:', error);
  process.exit(1);
});
