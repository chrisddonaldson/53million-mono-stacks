import axios, { AxiosInstance, AxiosError } from 'axios';
import winston from 'winston';
import {
  VikunjaTask,
  VikunjaProject,
  VikunjaUser,
  VikunjaAuthResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateProjectRequest,
  VikunjaInfo,
  VikunjaNowSchema,
  VikunjaTaskSchema,
  VikunjaProjectSchema,
  VikunjaAuthResponseSchema,
} from '../types/vikunja.js';

export class VikunjaClient {
  private client: AxiosInstance;
  private logger: winston.Logger;
  private token?: string;
  private user?: VikunjaUser;

  constructor(
    private baseURL: string,
    private username?: string,
    private password?: string,
    private apiToken?: string,
    logger?: winston.Logger
  ) {
    this.logger = logger || winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });

    this.client = axios.create({
      baseURL: `${this.baseURL}/api/v1`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      } else if (this.apiToken) {
        config.headers.Authorization = `Bearer ${this.apiToken}`;
      }
      this.logger.debug(`Making request to ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.logger.error('Vikunja API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
        });
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async authenticate(): Promise<VikunjaAuthResponse> {
    if (!this.username || !this.password) {
      if (this.apiToken) {
        this.logger.info('Using API token for authentication');
        return { token: this.apiToken, user: await this.getCurrentUser() };
      }
      throw new Error('No credentials provided');
    }

    try {
      const response = await this.client.post('/login', {
        username: this.username,
        password: this.password,
      });

      const authData = VikunjaAuthResponseSchema.parse(response.data);
      this.token = authData.token;
      this.user = authData.user;

      this.logger.info(`Authenticated as user: ${authData.user.username}`);
      return authData;
    } catch (error) {
      this.logger.error('Authentication failed:', error);
      throw new Error('Failed to authenticate with Vikunja');
    }
  }

  // Info endpoint
  async getInfo(): Promise<VikunjaInfo> {
    try {
      const response = await this.client.get('/info');
      return VikunjaNowSchema.parse(response.data);
    } catch (error) {
      this.logger.error('Failed to get Vikunja info:', error);
      throw error;
    }
  }

  // User operations
  async getCurrentUser(): Promise<VikunjaUser> {
    try {
      const response = await this.client.get('/user');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get current user:', error);
      throw error;
    }
  }

  // Task operations
  async getTasks(projectId?: number, page = 1, perPage = 50): Promise<VikunjaTask[]> {
    try {
      const params: any = { page, per_page: perPage };
      const endpoint = projectId ? `/projects/${projectId}/tasks` : '/tasks/all';
      
      const response = await this.client.get(endpoint, { params });
      
      if (Array.isArray(response.data)) {
        return response.data.map(task => VikunjaTaskSchema.parse(task));
      }
      return [];
    } catch (error) {
      this.logger.error('Failed to get tasks:', error);
      throw error;
    }
  }

  async getTask(taskId: number): Promise<VikunjaTask> {
    try {
      const response = await this.client.get(`/tasks/${taskId}`);
      return VikunjaTaskSchema.parse(response.data);
    } catch (error) {
      this.logger.error(`Failed to get task ${taskId}:`, error);
      throw error;
    }
  }

  async createTask(taskData: CreateTaskRequest): Promise<VikunjaTask> {
    try {
      const response = await this.client.put(`/projects/${taskData.project_id}`, taskData);
      const createdTask = VikunjaTaskSchema.parse(response.data);
      this.logger.info(`Created task: ${createdTask.title} (ID: ${createdTask.id})`);
      return createdTask;
    } catch (error) {
      this.logger.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(taskId: number, updates: UpdateTaskRequest): Promise<VikunjaTask> {
    try {
      const response = await this.client.post(`/tasks/${taskId}`, updates);
      const updatedTask = VikunjaTaskSchema.parse(response.data);
      this.logger.info(`Updated task: ${updatedTask.title} (ID: ${updatedTask.id})`);
      return updatedTask;
    } catch (error) {
      this.logger.error(`Failed to update task ${taskId}:`, error);
      throw error;
    }
  }

  async deleteTask(taskId: number): Promise<void> {
    try {
      await this.client.delete(`/tasks/${taskId}`);
      this.logger.info(`Deleted task ID: ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to delete task ${taskId}:`, error);
      throw error;
    }
  }

  // Project operations
  async getProjects(page = 1, perPage = 50): Promise<VikunjaProject[]> {
    try {
      const response = await this.client.get('/projects', {
        params: { page, per_page: perPage }
      });
      
      if (Array.isArray(response.data)) {
        return response.data.map(project => VikunjaProjectSchema.parse(project));
      }
      return [];
    } catch (error) {
      this.logger.error('Failed to get projects:', error);
      throw error;
    }
  }

  async getProject(projectId: number): Promise<VikunjaProject> {
    try {
      const response = await this.client.get(`/projects/${projectId}`);
      return VikunjaProjectSchema.parse(response.data);
    } catch (error) {
      this.logger.error(`Failed to get project ${projectId}:`, error);
      throw error;
    }
  }

  async createProject(projectData: CreateProjectRequest): Promise<VikunjaProject> {
    try {
      const response = await this.client.put('/projects', projectData);
      const createdProject = VikunjaProjectSchema.parse(response.data);
      this.logger.info(`Created project: ${createdProject.title} (ID: ${createdProject.id})`);
      return createdProject;
    } catch (error) {
      this.logger.error('Failed to create project:', error);
      throw error;
    }
  }

  async updateProject(projectId: number, updates: Partial<CreateProjectRequest>): Promise<VikunjaProject> {
    try {
      const response = await this.client.post(`/projects/${projectId}`, updates);
      const updatedProject = VikunjaProjectSchema.parse(response.data);
      this.logger.info(`Updated project: ${updatedProject.title} (ID: ${updatedProject.id})`);
      return updatedProject;
    } catch (error) {
      this.logger.error(`Failed to update project ${projectId}:`, error);
      throw error;
    }
  }

  async deleteProject(projectId: number): Promise<void> {
    try {
      await this.client.delete(`/projects/${projectId}`);
      this.logger.info(`Deleted project ID: ${projectId}`);
    } catch (error) {
      this.logger.error(`Failed to delete project ${projectId}:`, error);
      throw error;
    }
  }

  // Search functionality
  async searchTasks(query: string, projectId?: number): Promise<VikunjaTask[]> {
    try {
      const params: any = { s: query };
      if (projectId) {
        params.project_id = projectId;
      }

      const response = await this.client.get('/tasks/all', { params });
      
      if (Array.isArray(response.data)) {
        return response.data
          .map(task => VikunjaTaskSchema.parse(task))
          .filter(task => 
            task.title.toLowerCase().includes(query.toLowerCase()) ||
            task.description.toLowerCase().includes(query.toLowerCase())
          );
      }
      return [];
    } catch (error) {
      this.logger.error('Failed to search tasks:', error);
      throw error;
    }
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!(this.token || this.apiToken);
  }

  getCurrentToken(): string | undefined {
    return this.token || this.apiToken;
  }

  getCurrentUser(): VikunjaUser | undefined {
    return this.user;
  }
}