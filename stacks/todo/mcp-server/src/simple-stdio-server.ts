#!/usr/bin/env node
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

  async getTasks(options?: {
    project_id?: number;
    completed?: boolean;
    due_date_from?: string;
    due_date_to?: string;
    sort_by?: string;
    order_by?: string;
    per_page?: number;
  }): Promise<any[]> {
    if (!this.token) throw new Error('Not authenticated');
    
    const params: any = {
      per_page: options?.per_page || 50,
      sort_by: options?.sort_by || 'created',
      order_by: options?.order_by || 'desc'
    };
    
    // Add filters
    if (options?.project_id) {
      params.project = options.project_id;
    }
    
    // Filter by completion status (default to incomplete tasks)
    if (options?.completed !== undefined) {
      params.filter_by = options.completed ? 'done' : 'undone';
    } else {
      // Default to undone tasks
      params.filter_by = 'undone';
    }
    
    if (options?.due_date_from) {
      params.filter_value = `due_date >= ${options.due_date_from}`;
    }
    
    if (options?.due_date_to) {
      const existing = params.filter_value || '';
      params.filter_value = existing ? `${existing} && due_date <= ${options.due_date_to}` : `due_date <= ${options.due_date_to}`;
    }

    const endpoint = options?.project_id 
      ? `/projects/${options.project_id}/tasks` 
      : '/tasks/all';
    
    const response = await axios.get(`${this.baseUrl}/api/v1${endpoint}`, {
      headers: { Authorization: `Bearer ${this.token}` },
      params
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

  async createTask(taskData: { 
    title: string; 
    description?: string; 
    project_id: number;
    due_date?: string;
    priority?: number;
  }): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    
    const response = await axios.put(`${this.baseUrl}/api/v1/projects/${taskData.project_id}`, taskData, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }

  async updateTask(taskId: number, updates: {
    title?: string;
    description?: string;
    done?: boolean;
    due_date?: string;
    priority?: number;
  }): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    
    const response = await axios.post(`${this.baseUrl}/api/v1/tasks/${taskId}`, updates, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }

  async searchTasks(query: string, project_id?: number): Promise<any[]> {
    if (!this.token) throw new Error('Not authenticated');
    
    const params: any = { s: query };
    if (project_id) {
      params.project_id = project_id;
    }

    const response = await axios.get(`${this.baseUrl}/api/v1/tasks/all`, {
      headers: { Authorization: `Bearer ${this.token}` },
      params
    });
    
    const tasks = Array.isArray(response.data) ? response.data : [];
    return tasks.filter((task: any) => 
      task.title.toLowerCase().includes(query.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(query.toLowerCase()))
    );
  }

  // Task relationship methods
  async getTaskWithRelationships(taskId: number): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    
    const response = await axios.get(`${this.baseUrl}/api/v1/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }

  async getChildTasks(parentTaskId: number): Promise<any[]> {
    if (!this.token) throw new Error('Not authenticated');
    
    // Get all tasks and filter by parent relationship
    const response = await axios.get(`${this.baseUrl}/api/v1/tasks/all`, {
      headers: { Authorization: `Bearer ${this.token}` },
      params: { filter_by: 'parent', filter_value: parentTaskId }
    });
    
    return Array.isArray(response.data) ? response.data : [];
  }

  async getRelatedTasks(taskId: number, relationType?: string): Promise<any[]> {
    if (!this.token) throw new Error('Not authenticated');
    
    const task = await this.getTaskWithRelationships(taskId);
    
    if (!task.related_tasks || typeof task.related_tasks !== 'object') {
      return [];
    }

    const allRelated: any[] = [];
    
    // Get specific relationship type or all
    if (relationType) {
      const related = task.related_tasks[relationType] || [];
      allRelated.push(...related.map((t: any) => ({ ...t, relationship: relationType })));
    } else {
      // Get all relationship types
      Object.entries(task.related_tasks).forEach(([type, tasks]: [string, any]) => {
        if (Array.isArray(tasks)) {
          allRelated.push(...tasks.map((t: any) => ({ ...t, relationship: type })));
        }
      });
    }

    return allRelated;
  }

  async createTaskRelation(fromTaskId: number, toTaskId: number, relationType: string): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    
    const relationData = {
      task_id: fromTaskId,
      other_task_id: toTaskId,
      relation_kind: relationType
    };

    const response = await axios.put(`${this.baseUrl}/api/v1/tasks/${fromTaskId}/relations`, relationData, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }

  async deleteTaskRelation(fromTaskId: number, toTaskId: number, relationType: string): Promise<void> {
    if (!this.token) throw new Error('Not authenticated');
    
    const relationData = {
      task_id: fromTaskId,
      other_task_id: toTaskId,
      relation_kind: relationType
    };

    await axios.delete(`${this.baseUrl}/api/v1/tasks/${fromTaskId}/relations`, {
      headers: { Authorization: `Bearer ${this.token}` },
      data: relationData
    });
  }

  async moveChildTasks(fromParentId: number, toParentId: number): Promise<{ moved: any[], failed: any[] }> {
    if (!this.token) throw new Error('Not authenticated');
    
    const children = await this.getChildTasks(fromParentId);
    const results: { moved: any[], failed: any[] } = { moved: [], failed: [] };

    for (const child of children) {
      try {
        // Remove old parent relationship
        await this.deleteTaskRelation(child.id, fromParentId, 'parent');
        
        // Add new parent relationship
        await this.createTaskRelation(child.id, toParentId, 'parent');
        
        results.moved.push(child);
      } catch (error: any) {
        results.failed.push({ task: child, error: error.message });
      }
    }

    return results;
  }

  async setTaskParent(childTaskId: number, newParentId: number): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    
    // First, get current task to see if it has existing parent
    const task = await this.getTaskWithRelationships(childTaskId);
    
    // Remove existing parent relationships
    if (task.related_tasks?.parent?.length > 0) {
      for (const parent of task.related_tasks.parent) {
        await this.deleteTaskRelation(childTaskId, parent.id, 'parent');
      }
    }

    // Set new parent
    return await this.createTaskRelation(childTaskId, newParentId, 'parent');
  }

  async getTaskHierarchy(rootTaskId: number, maxDepth: number = 3): Promise<any> {
    if (!this.token) throw new Error('Not authenticated');
    
    const buildHierarchy = async (taskId: number, depth: number = 0): Promise<any> => {
      if (depth >= maxDepth) return null;
      
      const task = await this.getTaskWithRelationships(taskId);
      const children = await this.getChildTasks(taskId);
      
      const taskNode = {
        ...task,
        depth,
        children: []
      };

      // Recursively get children
      for (const child of children) {
        const childNode = await buildHierarchy(child.id, depth + 1);
        if (childNode) {
          taskNode.children.push(childNode);
        }
      }

      return taskNode;
    };

    return await buildHierarchy(rootTaskId);
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

// Simple JSON-RPC handler for MCP protocol
async function handleMCPRequest(request: any): Promise<any> {
  const { method, params, id } = request;

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
            },
            serverInfo: {
              name: 'vikunja-mcp-server',
              version: '1.0.0',
            },
          },
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              {
                name: 'get_tasks',
                description: 'Retrieve tasks from Vikunja with filtering options (defaults to incomplete tasks)',
                inputSchema: {
                  type: 'object',
                  properties: {
                    project_id: { type: 'number', description: 'Filter by project ID' },
                    completed: { type: 'boolean', description: 'Filter by completion status (default: false - incomplete tasks)' },
                    due_date_from: { type: 'string', description: 'Filter tasks due from this date (YYYY-MM-DD)' },
                    due_date_to: { type: 'string', description: 'Filter tasks due until this date (YYYY-MM-DD)' },
                    limit: { type: 'number', description: 'Maximum number of tasks to return (default: 50)' },
                  },
                },
              },
              {
                name: 'get_projects',
                description: 'Retrieve all projects from Vikunja',
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
                    project_id: { type: 'number', description: 'Project ID where to create the task' },
                    due_date: { type: 'string', description: 'Due date in ISO format (YYYY-MM-DDTHH:mm:ssZ)' },
                    priority: { type: 'number', description: 'Priority level (0-5, where 5 is highest)' },
                  },
                  required: ['title', 'project_id'],
                },
              },
              {
                name: 'update_task',
                description: 'Update an existing task in Vikunja',
                inputSchema: {
                  type: 'object',
                  properties: {
                    task_id: { type: 'number', description: 'ID of the task to update' },
                    title: { type: 'string', description: 'New task title' },
                    description: { type: 'string', description: 'New task description' },
                    done: { type: 'boolean', description: 'Mark task as completed/incomplete' },
                    due_date: { type: 'string', description: 'New due date in ISO format' },
                    priority: { type: 'number', description: 'New priority level (0-5)' },
                  },
                  required: ['task_id'],
                },
              },
              {
                name: 'search_tasks',
                description: 'Search for tasks by title or description',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query' },
                    project_id: { type: 'number', description: 'Optional: limit search to specific project' },
                  },
                  required: ['query'],
                },
              },
              {
                name: 'get_tasks_by_project',
                description: 'Get all tasks for a specific project (defaults to incomplete)',
                inputSchema: {
                  type: 'object',
                  properties: {
                    project_id: { type: 'number', description: 'Project ID' },
                    completed: { type: 'boolean', description: 'Include completed tasks (default: false)' },
                    limit: { type: 'number', description: 'Maximum number of tasks (default: 50)' },
                  },
                  required: ['project_id'],
                },
              },
              {
                name: 'get_overdue_tasks',
                description: 'Get all overdue tasks (tasks with due date in the past)',
                inputSchema: {
                  type: 'object',
                  properties: {
                    project_id: { type: 'number', description: 'Optional: filter by project ID' },
                  },
                },
              },
              {
                name: 'get_tasks_due_today',
                description: 'Get tasks due today',
                inputSchema: {
                  type: 'object',
                  properties: {
                    project_id: { type: 'number', description: 'Optional: filter by project ID' },
                  },
                },
              },
              {
                name: 'get_task_relationships',
                description: 'Get all relationships for a specific task (parent, children, dependencies, etc.)',
                inputSchema: {
                  type: 'object',
                  properties: {
                    task_id: { type: 'number', description: 'Task ID to get relationships for' },
                    relationship_type: { type: 'string', description: 'Optional: specific relationship type (parent, child, blocks, depends, etc.)' },
                  },
                  required: ['task_id'],
                },
              },
              {
                name: 'get_child_tasks',
                description: 'Get all child tasks (subtasks) of a parent task',
                inputSchema: {
                  type: 'object',
                  properties: {
                    parent_task_id: { type: 'number', description: 'Parent task ID' },
                  },
                  required: ['parent_task_id'],
                },
              },
              {
                name: 'create_task_relationship',
                description: 'Create a relationship between two tasks',
                inputSchema: {
                  type: 'object',
                  properties: {
                    from_task_id: { type: 'number', description: 'Source task ID' },
                    to_task_id: { type: 'number', description: 'Target task ID' },
                    relationship_type: { 
                      type: 'string', 
                      description: 'Relationship type: parent, child, blocks, depends, duplicate, related',
                      enum: ['parent', 'child', 'blocks', 'depends', 'duplicate', 'related']
                    },
                  },
                  required: ['from_task_id', 'to_task_id', 'relationship_type'],
                },
              },
              {
                name: 'remove_task_relationship',
                description: 'Remove a relationship between two tasks',
                inputSchema: {
                  type: 'object',
                  properties: {
                    from_task_id: { type: 'number', description: 'Source task ID' },
                    to_task_id: { type: 'number', description: 'Target task ID' },
                    relationship_type: { 
                      type: 'string', 
                      description: 'Relationship type to remove',
                      enum: ['parent', 'child', 'blocks', 'depends', 'duplicate', 'related']
                    },
                  },
                  required: ['from_task_id', 'to_task_id', 'relationship_type'],
                },
              },
              {
                name: 'move_child_tasks',
                description: 'Move all child tasks from one parent to another parent',
                inputSchema: {
                  type: 'object',
                  properties: {
                    from_parent_id: { type: 'number', description: 'Current parent task ID' },
                    to_parent_id: { type: 'number', description: 'New parent task ID' },
                  },
                  required: ['from_parent_id', 'to_parent_id'],
                },
              },
              {
                name: 'set_task_parent',
                description: 'Set or change the parent of a task',
                inputSchema: {
                  type: 'object',
                  properties: {
                    child_task_id: { type: 'number', description: 'Task ID to set parent for' },
                    new_parent_id: { type: 'number', description: 'New parent task ID' },
                  },
                  required: ['child_task_id', 'new_parent_id'],
                },
              },
              {
                name: 'get_task_hierarchy',
                description: 'Get the complete hierarchy tree for a task (with all children and sub-children)',
                inputSchema: {
                  type: 'object',
                  properties: {
                    root_task_id: { type: 'number', description: 'Root task ID to build hierarchy from' },
                    max_depth: { type: 'number', description: 'Maximum depth to traverse (default: 3)' },
                  },
                  required: ['root_task_id'],
                },
              },
              {
                name: 'get_orphaned_tasks',
                description: 'Find tasks that have no parent relationships',
                inputSchema: {
                  type: 'object',
                  properties: {
                    project_id: { type: 'number', description: 'Optional: filter by project ID' },
                  },
                },
              },
              {
                name: 'get_blocked_tasks',
                description: 'Get tasks that are blocked by dependencies',
                inputSchema: {
                  type: 'object',
                  properties: {
                    project_id: { type: 'number', description: 'Optional: filter by project ID' },
                  },
                },
              },
            ],
          },
        };

      case 'tools/call':
        await ensureAuthenticated();
        const { name, arguments: args } = params;
        let result;

        switch (name) {
          case 'get_tasks':
            const tasks = await vikunjaClient.getTasks({
              project_id: args?.project_id,
              completed: args?.completed,
              due_date_from: args?.due_date_from,
              due_date_to: args?.due_date_to,
              per_page: args?.limit || 50
            });
            
            const formatTask = (task: any) => {
              const status = task.done ? '✅ Done' : '⏳ Pending';
              const priority = task.priority > 0 ? ` [Priority: ${task.priority}]` : '';
              const dueDate = task.due_date ? ` [Due: ${new Date(task.due_date).toLocaleDateString()}]` : '';
              const project = task.project_id ? ` [Project: ${task.project_id}]` : '';
              return `• ${task.title} (ID: ${task.id})${priority}${dueDate}${project}\n  Status: ${status}`;
            };

            result = {
              content: [
                {
                  type: 'text',
                  text: `Found ${tasks.length} tasks${args?.completed === false ? ' (incomplete only)' : args?.completed === true ? ' (completed only)' : ' (incomplete by default)'}:\n\n${tasks.map(formatTask).join('\n\n')}`,
                },
              ],
            };
            break;

          case 'get_projects':
            const projects = await vikunjaClient.getProjects();
            result = {
              content: [
                {
                  type: 'text',
                  text: `Found ${projects.length} projects:\n\n${projects.map((project: any) => 
                    `• ${project.title} (ID: ${project.id})\n  Description: ${project.description || 'No description'}`
                  ).join('\n\n')}`,
                },
              ],
            };
            break;

          case 'create_task':
            const task = await vikunjaClient.createTask(args);
            const taskDetails = [
              `✅ Created task: ${task.title} (ID: ${task.id})`,
              `Project: ${task.project_id}`,
              task.description ? `Description: ${task.description}` : null,
              task.due_date ? `Due: ${new Date(task.due_date).toLocaleDateString()}` : null,
              task.priority > 0 ? `Priority: ${task.priority}` : null
            ].filter(Boolean).join('\n');
            
            result = {
              content: [
                {
                  type: 'text',
                  text: taskDetails,
                },
              ],
            };
            break;

          case 'update_task':
            const updatedTask = await vikunjaClient.updateTask(args.task_id, {
              title: args.title,
              description: args.description,
              done: args.done,
              due_date: args.due_date,
              priority: args.priority
            });
            
            result = {
              content: [
                {
                  type: 'text',
                  text: `✅ Updated task: ${updatedTask.title} (ID: ${updatedTask.id})\nStatus: ${updatedTask.done ? 'Completed' : 'Pending'}`,
                },
              ],
            };
            break;

          case 'search_tasks':
            const searchResults = await vikunjaClient.searchTasks(args.query, args.project_id);
            result = {
              content: [
                {
                  type: 'text',
                  text: searchResults.length > 0 
                    ? `Found ${searchResults.length} tasks matching "${args.query}":\n\n${searchResults.map((task: any) => 
                        `• ${task.title} (ID: ${task.id})\n  Status: ${task.done ? '✅ Done' : '⏳ Pending'}\n  Project: ${task.project_id}`
                      ).join('\n\n')}`
                    : `No tasks found matching "${args.query}"`,
                },
              ],
            };
            break;

          case 'get_tasks_by_project':
            const projectTasks = await vikunjaClient.getTasks({
              project_id: args.project_id,
              completed: args.completed || false,
              per_page: args.limit || 50
            });
            
            result = {
              content: [
                {
                  type: 'text',
                  text: `Found ${projectTasks.length} ${args.completed ? 'completed' : 'incomplete'} tasks in project ${args.project_id}:\n\n${projectTasks.map((task: any) => 
                    `• ${task.title} (ID: ${task.id})\n  Status: ${task.done ? '✅ Done' : '⏳ Pending'}${task.due_date ? `\n  Due: ${new Date(task.due_date).toLocaleDateString()}` : ''}`
                  ).join('\n\n')}`,
                },
              ],
            };
            break;

          case 'get_overdue_tasks':
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            const overdueTasks = await vikunjaClient.getTasks({
              project_id: args?.project_id,
              completed: false,
              due_date_to: yesterday.toISOString().split('T')[0]
            });
            
            result = {
              content: [
                {
                  type: 'text',
                  text: overdueTasks.length > 0 
                    ? `⚠️ Found ${overdueTasks.length} overdue tasks:\n\n${overdueTasks.map((task: any) => 
                        `• ${task.title} (ID: ${task.id})\n  Due: ${new Date(task.due_date).toLocaleDateString()} (${Math.floor((today.getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))} days overdue)\n  Project: ${task.project_id}`
                      ).join('\n\n')}`
                    : '✅ No overdue tasks found!',
                },
              ],
            };
            break;

          case 'get_tasks_due_today':
            const todayStr = new Date().toISOString().split('T')[0];
            const todayTasks = await vikunjaClient.getTasks({
              project_id: args?.project_id,
              completed: false,
              due_date_from: todayStr,
              due_date_to: todayStr
            });
            
            result = {
              content: [
                {
                  type: 'text',
                  text: todayTasks.length > 0 
                    ? `📅 Found ${todayTasks.length} tasks due today:\n\n${todayTasks.map((task: any) => 
                        `• ${task.title} (ID: ${task.id})\n  Project: ${task.project_id}${task.priority > 0 ? `\n  Priority: ${task.priority}` : ''}`
                      ).join('\n\n')}`
                    : '✅ No tasks due today!',
                },
              ],
            };
            break;

          case 'get_task_relationships':
            const taskWithRelations = await vikunjaClient.getTaskWithRelationships(args.task_id);
            const relatedTasks = await vikunjaClient.getRelatedTasks(args.task_id, args.relationship_type);
            
            result = {
              content: [
                {
                  type: 'text',
                  text: `Task: ${taskWithRelations.title} (ID: ${args.task_id})\n\n` +
                        (relatedTasks.length > 0 
                          ? `Found ${relatedTasks.length} related tasks:\n\n${relatedTasks.map((task: any) => 
                              `• ${task.title} (ID: ${task.id})\n  Relationship: ${task.relationship}\n  Status: ${task.done ? '✅ Done' : '⏳ Pending'}`
                            ).join('\n\n')}`
                          : 'No related tasks found.'),
                },
              ],
            };
            break;

          case 'get_child_tasks':
            const childTasks = await vikunjaClient.getChildTasks(args.parent_task_id);
            
            result = {
              content: [
                {
                  type: 'text',
                  text: childTasks.length > 0 
                    ? `Found ${childTasks.length} child tasks for parent ${args.parent_task_id}:\n\n${childTasks.map((task: any) => 
                        `• ${task.title} (ID: ${task.id})\n  Status: ${task.done ? '✅ Done' : '⏳ Pending'}${task.due_date ? `\n  Due: ${new Date(task.due_date).toLocaleDateString()}` : ''}`
                      ).join('\n\n')}`
                    : `No child tasks found for parent ${args.parent_task_id}.`,
                },
              ],
            };
            break;

          case 'create_task_relationship':
            await vikunjaClient.createTaskRelation(args.from_task_id, args.to_task_id, args.relationship_type);
            
            result = {
              content: [
                {
                  type: 'text',
                  text: `✅ Created ${args.relationship_type} relationship: Task ${args.from_task_id} → Task ${args.to_task_id}`,
                },
              ],
            };
            break;

          case 'remove_task_relationship':
            await vikunjaClient.deleteTaskRelation(args.from_task_id, args.to_task_id, args.relationship_type);
            
            result = {
              content: [
                {
                  type: 'text',
                  text: `✅ Removed ${args.relationship_type} relationship between Task ${args.from_task_id} and Task ${args.to_task_id}`,
                },
              ],
            };
            break;

          case 'move_child_tasks':
            const moveResults = await vikunjaClient.moveChildTasks(args.from_parent_id, args.to_parent_id);
            
            const moveText = [
              `✅ Moved ${moveResults.moved.length} child tasks from parent ${args.from_parent_id} to parent ${args.to_parent_id}`,
              moveResults.moved.length > 0 ? '\nMoved tasks:' : '',
              ...moveResults.moved.map((task: any) => `• ${task.title} (ID: ${task.id})`),
              moveResults.failed.length > 0 ? '\nFailed to move:' : '',
              ...moveResults.failed.map((item: any) => `• ${item.task.title} (ID: ${item.task.id}) - ${item.error}`)
            ].filter(Boolean).join('\n');
            
            result = {
              content: [
                {
                  type: 'text',
                  text: moveText,
                },
              ],
            };
            break;

          case 'set_task_parent':
            await vikunjaClient.setTaskParent(args.child_task_id, args.new_parent_id);
            
            result = {
              content: [
                {
                  type: 'text',
                  text: `✅ Set task ${args.child_task_id} as child of task ${args.new_parent_id}`,
                },
              ],
            };
            break;

          case 'get_task_hierarchy':
            const hierarchy = await vikunjaClient.getTaskHierarchy(args.root_task_id, args.max_depth || 3);
            
            const formatHierarchy = (node: any, indent = ''): string => {
              const status = node.done ? '✅' : '⏳';
              const priority = node.priority > 0 ? ` [P${node.priority}]` : '';
              const due = node.due_date ? ` [Due: ${new Date(node.due_date).toLocaleDateString()}]` : '';
              
              let text = `${indent}${status} ${node.title} (ID: ${node.id})${priority}${due}`;
              
              if (node.children && node.children.length > 0) {
                text += `\n${node.children.map((child: any) => formatHierarchy(child, indent + '  ')).join('\n')}`;
              }
              
              return text;
            };
            
            result = {
              content: [
                {
                  type: 'text',
                  text: hierarchy 
                    ? `Task Hierarchy for ${hierarchy.title} (ID: ${args.root_task_id}):\n\n${formatHierarchy(hierarchy)}`
                    : `Task ${args.root_task_id} not found.`,
                },
              ],
            };
            break;

          case 'get_orphaned_tasks':
            const allTasks = await vikunjaClient.getTasks({
              project_id: args?.project_id,
              completed: false,
              per_page: 100
            });
            
            const orphanedTasks = [];
            for (const task of allTasks) {
              const relations = await vikunjaClient.getRelatedTasks(task.id, 'parent');
              if (relations.length === 0) {
                orphanedTasks.push(task);
              }
            }
            
            result = {
              content: [
                {
                  type: 'text',
                  text: orphanedTasks.length > 0 
                    ? `Found ${orphanedTasks.length} orphaned tasks (no parent):\n\n${orphanedTasks.map((task: any) => 
                        `• ${task.title} (ID: ${task.id})\n  Project: ${task.project_id}`
                      ).join('\n\n')}`
                    : '✅ No orphaned tasks found.',
                },
              ],
            };
            break;

          case 'get_blocked_tasks':
            const blockedTasks = [];
            const taskList = await vikunjaClient.getTasks({
              project_id: args?.project_id,
              completed: false,
              per_page: 100
            });
            
            for (const task of taskList) {
              const dependencies = await vikunjaClient.getRelatedTasks(task.id, 'depends');
              const incompleteDeps = dependencies.filter((dep: any) => !dep.done);
              if (incompleteDeps.length > 0) {
                blockedTasks.push({ task, dependencies: incompleteDeps });
              }
            }
            
            result = {
              content: [
                {
                  type: 'text',
                  text: blockedTasks.length > 0 
                    ? `🚫 Found ${blockedTasks.length} blocked tasks:\n\n${blockedTasks.map((item: any) => 
                        `• ${item.task.title} (ID: ${item.task.id})\n  Blocked by: ${item.dependencies.map((dep: any) => `${dep.title} (${dep.id})`).join(', ')}`
                      ).join('\n\n')}`
                    : '✅ No blocked tasks found.',
                },
              ],
            };
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          jsonrpc: '2.0',
          id,
          result,
        };

      case 'resources/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            resources: [
              {
                uri: 'vikunja://info',
                mimeType: 'application/json',
                name: 'Vikunja instance information',
                description: 'Information about the Vikunja instance',
              },
            ],
          },
        };

      case 'resources/read':
        const { uri } = params;
        if (uri === 'vikunja://info') {
          const info = await vikunjaClient.getInfo();
          return {
            jsonrpc: '2.0',
            id,
            result: {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify(info, null, 2),
                },
              ],
            },
          };
        }
        throw new Error(`Unknown resource: ${uri}`);

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        };
    }
  } catch (error: any) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error.message,
      },
    };
  }
}

async function main() {
  try {
    // Test connection and authenticate if needed
    await vikunjaClient.getInfo();
    await ensureAuthenticated();
  } catch (error) {
    // Log to stderr so it doesn't interfere with STDIO transport
    console.error('Warning: Could not connect to Vikunja:', (error as Error).message);
  }

  // Set up STDIO communication
  process.stdin.setEncoding('utf8');
  
  let buffer = '';
  
  process.stdin.on('data', async (chunk: string) => {
    buffer += chunk;
    
    // Process complete JSON-RPC messages (separated by newlines)
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const request = JSON.parse(line);
          const response = await handleMCPRequest(request);
          console.log(JSON.stringify(response));
        } catch (error) {
          console.error('Error processing request:', error);
        }
      }
    }
  });

  // Keep the process running
  process.stdin.resume();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}