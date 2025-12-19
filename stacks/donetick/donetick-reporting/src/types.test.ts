/**
 * Unit tests for DoneTick types
 */

import { describe, it, expect } from 'vitest';
import { DoneTickError } from './types.js';

describe('DoneTickError', () => {
  describe('constructor', () => {
    it('should create error with message only', () => {
      const error = new DoneTickError('Test error message');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(DoneTickError);
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('DoneTickError');
      expect(error.statusCode).toBeUndefined();
      expect(error.cause).toBeUndefined();
    });

    it('should create error with message and status code', () => {
      const error = new DoneTickError('Unauthorized access', 401);

      expect(error.message).toBe('Unauthorized access');
      expect(error.statusCode).toBe(401);
      expect(error.cause).toBeUndefined();
    });

    it('should create error with message, status code, and cause', () => {
      const originalError = new Error('Original error');
      const error = new DoneTickError('Wrapped error', 500, originalError);

      expect(error.message).toBe('Wrapped error');
      expect(error.statusCode).toBe(500);
      expect(error.cause).toBe(originalError);
    });

    it('should create error with message and cause but no status code', () => {
      const originalError = new Error('Network failure');
      const error = new DoneTickError('Failed to connect', undefined, originalError);

      expect(error.message).toBe('Failed to connect');
      expect(error.statusCode).toBeUndefined();
      expect(error.cause).toBe(originalError);
    });

    it('should allow non-Error objects as cause', () => {
      const cause = { type: 'custom', detail: 'something went wrong' };
      const error = new DoneTickError('Custom error', 400, cause);

      expect(error.cause).toBe(cause);
      expect(error.cause).toEqual({ type: 'custom', detail: 'something went wrong' });
    });

    it('should allow string as cause', () => {
      const error = new DoneTickError('Error occurred', 404, 'Resource not found');

      expect(error.cause).toBe('Resource not found');
    });
  });

  describe('error properties', () => {
    it('should have correct name property', () => {
      const error = new DoneTickError('Test');
      expect(error.name).toBe('DoneTickError');
    });

    it('should preserve message property', () => {
      const message = 'Detailed error message with context';
      const error = new DoneTickError(message);
      expect(error.message).toBe(message);
    });

    it('should maintain statusCode property', () => {
      const error = new DoneTickError('Not found', 404);
      expect(error.statusCode).toBe(404);
      expect(error.statusCode).toBeTypeOf('number');
    });

    it('should maintain cause property', () => {
      const cause = new TypeError('Invalid type');
      const error = new DoneTickError('Type error occurred', 400, cause);
      expect(error.cause).toBe(cause);
      expect(error.cause).toBeInstanceOf(TypeError);
    });
  });

  describe('inheritance', () => {
    it('should be instanceof Error', () => {
      const error = new DoneTickError('Test');
      expect(error instanceof Error).toBe(true);
    });

    it('should be instanceof DoneTickError', () => {
      const error = new DoneTickError('Test');
      expect(error instanceof DoneTickError).toBe(true);
    });

    it('should have Error in prototype chain', () => {
      const error = new DoneTickError('Test');
      expect(Object.getPrototypeOf(error.constructor)).toBe(Error);
    });
  });

  describe('common HTTP status codes', () => {
    it('should handle 400 Bad Request', () => {
      const error = new DoneTickError('Bad request', 400);
      expect(error.statusCode).toBe(400);
    });

    it('should handle 401 Unauthorized', () => {
      const error = new DoneTickError('Unauthorized', 401);
      expect(error.statusCode).toBe(401);
    });

    it('should handle 403 Forbidden', () => {
      const error = new DoneTickError('Forbidden', 403);
      expect(error.statusCode).toBe(403);
    });

    it('should handle 404 Not Found', () => {
      const error = new DoneTickError('Not found', 404);
      expect(error.statusCode).toBe(404);
    });

    it('should handle 500 Internal Server Error', () => {
      const error = new DoneTickError('Internal server error', 500);
      expect(error.statusCode).toBe(500);
    });

    it('should handle 503 Service Unavailable', () => {
      const error = new DoneTickError('Service unavailable', 503);
      expect(error.statusCode).toBe(503);
    });
  });

  describe('error throwing and catching', () => {
    it('should be throwable', () => {
      expect(() => {
        throw new DoneTickError('Test error');
      }).toThrow(DoneTickError);
    });

    it('should be catchable as DoneTickError', () => {
      try {
        throw new DoneTickError('Test error', 500);
      } catch (error) {
        expect(error).toBeInstanceOf(DoneTickError);
        if (error instanceof DoneTickError) {
          expect(error.message).toBe('Test error');
          expect(error.statusCode).toBe(500);
        }
      }
    });

    it('should be catchable as Error', () => {
      try {
        throw new DoneTickError('Test error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toBe('Test error');
        }
      }
    });

    it('should preserve stack trace', () => {
      const error = new DoneTickError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('Test error');
    });
  });

  describe('error message formatting', () => {
    it('should handle empty string message', () => {
      const error = new DoneTickError('');
      expect(error.message).toBe('');
    });

    it('should handle multiline messages', () => {
      const message = 'First line\nSecond line\nThird line';
      const error = new DoneTickError(message);
      expect(error.message).toBe(message);
    });

    it('should handle special characters in message', () => {
      const message = 'Error: "Invalid" <input> & other stuff';
      const error = new DoneTickError(message);
      expect(error.message).toBe(message);
    });

    it('should handle very long messages', () => {
      const message = 'a'.repeat(1000);
      const error = new DoneTickError(message);
      expect(error.message).toBe(message);
      expect(error.message.length).toBe(1000);
    });
  });

  describe('type safety', () => {
    it('should allow type checking with instanceof', () => {
      const error: Error = new DoneTickError('Test', 400);

      if (error instanceof DoneTickError) {
        // TypeScript should know statusCode exists here
        expect(error.statusCode).toBe(400);
      } else {
        throw new Error('Should be DoneTickError');
      }
    });

    it('should differentiate from standard Error', () => {
      const standardError = new Error('Standard');
      const doneTickError = new DoneTickError('DoneTick');

      expect(standardError instanceof DoneTickError).toBe(false);
      expect(doneTickError instanceof Error).toBe(true);
    });
  });
});
