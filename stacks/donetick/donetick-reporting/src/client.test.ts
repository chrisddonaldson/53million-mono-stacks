/**
 * Unit tests for DoneTickClient
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DoneTickClient } from './client.js';
import { DoneTickError, Chore } from './types.js';
import { logger } from './logger.js';

// Mock the logger to avoid console output during tests
vi.mock('./logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

type MockFetchResponseOptions = {
  ok?: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string | null>;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
};

function createMockFetchResponse(options: MockFetchResponseOptions = {}) {
  const {
    ok = true,
    status = 200,
    statusText = 'OK',
    headers = { 'content-type': 'application/json' },
    json = async () => ({}),
    text = async () => '',
  } = options;

  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    ok,
    status,
    statusText,
    headers: {
      get: (name: string) => normalizedHeaders[name.toLowerCase()] ?? null,
    },
    json,
    text,
  };
}

describe('DoneTickClient', () => {
  const mockConfig = {
    url: 'https://api.example.com',
    accessToken: 'test-token-123',
  };

  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if URL is not provided', () => {
      expect(() => new DoneTickClient({ url: '', accessToken: 'token' })).toThrow(
        'DoneTick URL is required',
      );
    });

    it('should throw error if access token is not provided', () => {
      expect(() => new DoneTickClient({ url: 'https://api.example.com', accessToken: '' })).toThrow(
        'Access token is required',
      );
    });

    it('should remove trailing slash from URL', () => {
      const client = new DoneTickClient({
        url: 'https://api.example.com/',
        accessToken: 'token',
      });
      expect(client).toBeDefined();
      expect(logger.debug).toHaveBeenCalledWith('DoneTick client initialized', {
        url: 'https://api.example.com',
      });
    });

    it('should accept URL without trailing slash', () => {
      const client = new DoneTickClient(mockConfig);
      expect(client).toBeDefined();
      expect(logger.debug).toHaveBeenCalledWith('DoneTick client initialized', {
        url: 'https://api.example.com',
      });
    });

    it('should log debug message on initialization', () => {
      new DoneTickClient(mockConfig);
      expect(logger.debug).toHaveBeenCalledWith('DoneTick client initialized', {
        url: mockConfig.url,
      });
    });
  });

  describe('getAllChores', () => {
    it('should fetch and return array of chores', async () => {
      const mockChores: Chore[] = [
        {
          id: 1,
          name: 'Test Chore 1',
          frequencyType: 'daily',
          frequency: 1,
          frequencyMetadata: null,
          nextDueDate: '2025-01-01',
          isRolling: false,
          assignedTo: 1,
          assignees: [{ userId: 1 }],
          assignStrategy: 'random',
          isActive: true,
          notification: false,
          notificationMetadata: null,
          labels: null,
          labelsV2: [],
          circleId: 1,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
          createdBy: 1,
          updatedBy: 1,
          thingChore: null,
          status: 1,
          priority: 1,
        },
        {
          id: 2,
          name: 'Test Chore 2',
          frequencyType: 'weekly',
          frequency: 1,
          frequencyMetadata: null,
          nextDueDate: '2025-01-08',
          isRolling: true,
          assignedTo: 2,
          assignees: [{ userId: 2 }],
          assignStrategy: 'least_completed',
          isActive: true,
          notification: true,
          notificationMetadata: null,
          labels: null,
          labelsV2: [],
          circleId: 1,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
          createdBy: 1,
          updatedBy: 1,
          thingChore: null,
          status: 1,
          priority: 2,
        },
      ];

      fetchMock.mockResolvedValue(
        createMockFetchResponse({
          json: async () => mockChores,
        }),
      );

      const client = new DoneTickClient(mockConfig);
      const chores = await client.getAllChores();

      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/eapi/v1/chore', {
        method: 'GET',
        headers: {
          secretkey: 'test-token-123',
          'Content-Type': 'application/json',
        },
      });

      expect(chores).toEqual(mockChores);
      expect(chores).toHaveLength(2);
      expect(logger.info).toHaveBeenCalledWith('Fetching all chores from DoneTick API');
      expect(logger.info).toHaveBeenCalledWith('Successfully fetched 2 chores');
    });

    it('should handle wrapped response format with res property', async () => {
      const mockChores: Chore[] = [
        {
          id: 1,
          name: 'Test Chore',
          frequencyType: 'daily',
          frequency: 1,
          frequencyMetadata: null,
          nextDueDate: null,
          isRolling: false,
          assignedTo: 1,
          assignees: [],
          assignStrategy: 'random',
          isActive: true,
          notification: false,
          notificationMetadata: null,
          labels: null,
          labelsV2: [],
          circleId: 1,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-01',
          createdBy: 1,
          updatedBy: 1,
          thingChore: null,
          status: 1,
          priority: 1,
        },
      ];

      fetchMock.mockResolvedValue(
        createMockFetchResponse({
          json: async () => ({ res: mockChores }),
        }),
      );

      const client = new DoneTickClient(mockConfig);
      const chores = await client.getAllChores();

      expect(chores).toEqual(mockChores);
      expect(chores).toHaveLength(1);
    });

    it('should return empty array when no chores exist', async () => {
      fetchMock.mockResolvedValue(
        createMockFetchResponse({
          json: async () => [],
        }),
      );

      const client = new DoneTickClient(mockConfig);
      const chores = await client.getAllChores();

      expect(chores).toEqual([]);
      expect(chores).toHaveLength(0);
      expect(logger.info).toHaveBeenCalledWith('Successfully fetched 0 chores');
    });

    it('should throw DoneTickError on HTTP 401 Unauthorized', async () => {
      fetchMock.mockResolvedValue(
        createMockFetchResponse({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          text: async () => 'Invalid credentials',
        }),
      );

      const client = new DoneTickClient(mockConfig);

      await expect(client.getAllChores()).rejects.toThrow(DoneTickError);
      await expect(client.getAllChores()).rejects.toThrow(
        'Failed to fetch chores: 401 Unauthorized',
      );

      expect(logger.error).toHaveBeenCalledWith('API request failed with status 401', {
        errorText: 'Invalid credentials',
      });
    });

    it('should throw DoneTickError on HTTP 404 Not Found', async () => {
      fetchMock.mockResolvedValue(
        createMockFetchResponse({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: async () => 'Endpoint not found',
        }),
      );

      const client = new DoneTickClient(mockConfig);

      await expect(client.getAllChores()).rejects.toThrow(DoneTickError);
      await expect(client.getAllChores()).rejects.toThrow('Failed to fetch chores: 404 Not Found');
    });

    it('should throw DoneTickError on HTTP 500 Server Error', async () => {
      fetchMock.mockResolvedValue(
        createMockFetchResponse({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server error',
        }),
      );

      const client = new DoneTickClient(mockConfig);

      await expect(client.getAllChores()).rejects.toThrow(DoneTickError);
      await expect(client.getAllChores()).rejects.toThrow(
        'Failed to fetch chores: 500 Internal Server Error',
      );
    });

    it('should handle error when response.text() fails', async () => {
      fetchMock.mockResolvedValue(
        createMockFetchResponse({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => {
            throw new Error('Cannot read response');
          },
        }),
      );

      const client = new DoneTickClient(mockConfig);

      await expect(client.getAllChores()).rejects.toThrow(DoneTickError);
      expect(logger.error).toHaveBeenCalledWith('API request failed with status 500', {
        errorText: 'Unknown error',
      });
    });

    it('should throw DoneTickError when response is not an array or wrapped object', async () => {
      fetchMock.mockResolvedValue(
        createMockFetchResponse({
          json: async () => ({ invalid: 'format', res: 'not an array' }),
        }),
      );

      const client = new DoneTickClient(mockConfig);

      await expect(client.getAllChores()).rejects.toThrow(DoneTickError);
      await expect(client.getAllChores()).rejects.toThrow('Invalid response format from API');
    });

    it('should throw DoneTickError on network error', async () => {
      fetchMock.mockRejectedValue(new Error('Network failure'));

      const client = new DoneTickClient(mockConfig);

      await expect(client.getAllChores()).rejects.toThrow(DoneTickError);
      await expect(client.getAllChores()).rejects.toThrow(
        'Failed to fetch chores: Network failure',
      );

      expect(logger.error).toHaveBeenCalledWith('Unexpected error fetching chores', {
        error: expect.any(Error),
      });
    });

    it('should throw DoneTickError on unknown error type', async () => {
      fetchMock.mockRejectedValue('string error');

      const client = new DoneTickClient(mockConfig);

      await expect(client.getAllChores()).rejects.toThrow(DoneTickError);
      await expect(client.getAllChores()).rejects.toThrow('An unknown error occurred');
    });

    it('should rethrow DoneTickError without wrapping', async () => {
      const originalError = new DoneTickError('Original error', 400);
      fetchMock.mockRejectedValue(originalError);

      const client = new DoneTickClient(mockConfig);

      await expect(client.getAllChores()).rejects.toThrow(originalError);
    });
  });

  describe('getChore', () => {
    it('should fetch and return a specific chore by ID', async () => {
      const mockChore: Chore = {
        id: 42,
        name: 'Specific Chore',
        frequencyType: 'monthly',
        frequency: 1,
        frequencyMetadata: null,
        nextDueDate: '2025-02-01',
        isRolling: false,
        assignedTo: 3,
        assignees: [{ userId: 3 }],
        assignStrategy: 'least_assigned',
        isActive: true,
        notification: true,
        notificationMetadata: null,
        labels: null,
        labelsV2: [{ id: 1, name: 'urgent', color: '#ff0000', created_by: 1 }],
        circleId: 1,
        createdAt: '2025-01-01',
        updatedAt: '2025-01-15',
        createdBy: 1,
        updatedBy: 2,
        thingChore: null,
        status: 1,
        priority: 3,
        description: 'A detailed description',
      };

      fetchMock.mockResolvedValue(
        createMockFetchResponse({
          json: async () => mockChore,
        }),
      );

      const client = new DoneTickClient(mockConfig);
      const chore = await client.getChore(42);

      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/eapi/v1/chore/42', {
        method: 'GET',
        headers: {
          secretkey: 'test-token-123',
          'Content-Type': 'application/json',
        },
      });

      expect(chore).toEqual(mockChore);
      expect(chore.id).toBe(42);
      expect(chore.name).toBe('Specific Chore');
      expect(logger.info).toHaveBeenCalledWith('Fetching chore with ID: 42');
      expect(logger.info).toHaveBeenCalledWith('Successfully fetched chore 42');
    });

    it('should throw DoneTickError on HTTP 404 Not Found', async () => {
      fetchMock.mockResolvedValue(
        createMockFetchResponse({
          ok: false,
          status: 404,
          statusText: 'Not Found',
          text: async () => 'Chore not found',
        }),
      );

      const client = new DoneTickClient(mockConfig);

      await expect(client.getChore(999)).rejects.toThrow(DoneTickError);
      await expect(client.getChore(999)).rejects.toThrow('Failed to fetch chore: 404 Not Found');

      expect(logger.error).toHaveBeenCalledWith('API request failed with status 404', {
        errorText: 'Chore not found',
      });
    });

    it('should throw DoneTickError on HTTP 401 Unauthorized', async () => {
      fetchMock.mockResolvedValue(
        createMockFetchResponse({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          text: async () => 'Invalid token',
        }),
      );

      const client = new DoneTickClient(mockConfig);

      await expect(client.getChore(1)).rejects.toThrow(DoneTickError);
      await expect(client.getChore(1)).rejects.toThrow('Failed to fetch chore: 401 Unauthorized');
    });

    it('should handle error when response.text() fails', async () => {
      fetchMock.mockResolvedValue(
        createMockFetchResponse({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => {
            throw new Error('Cannot read response');
          },
        }),
      );

      const client = new DoneTickClient(mockConfig);

      await expect(client.getChore(1)).rejects.toThrow(DoneTickError);
      expect(logger.error).toHaveBeenCalledWith('API request failed with status 500', {
        errorText: 'Unknown error',
      });
    });

    it('should throw DoneTickError on network error', async () => {
      fetchMock.mockRejectedValue(new Error('Connection timeout'));

      const client = new DoneTickClient(mockConfig);

      await expect(client.getChore(1)).rejects.toThrow(DoneTickError);
      await expect(client.getChore(1)).rejects.toThrow('Failed to fetch chore: Connection timeout');

      expect(logger.error).toHaveBeenCalledWith('Unexpected error fetching chore', {
        error: expect.any(Error),
      });
    });

    it('should throw DoneTickError on unknown error type', async () => {
      fetchMock.mockRejectedValue({ unknown: 'error object' });

      const client = new DoneTickClient(mockConfig);

      await expect(client.getChore(1)).rejects.toThrow(DoneTickError);
      await expect(client.getChore(1)).rejects.toThrow('An unknown error occurred');
    });

    it('should rethrow DoneTickError without wrapping', async () => {
      const originalError = new DoneTickError('Original error', 403);
      fetchMock.mockRejectedValue(originalError);

      const client = new DoneTickClient(mockConfig);

      await expect(client.getChore(1)).rejects.toThrow(originalError);
    });
  });
});
