/**
 * Unit tests for Logger
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, LogLevel } from './logger.js';

describe('Logger', () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should default to INFO log level', () => {
      const logger = new Logger();
      logger.info('test message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] test message');
    });

    it('should accept custom log level in constructor', () => {
      const logger = new Logger(LogLevel.ERROR);
      logger.info('should not appear');
      logger.error('should appear');

      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] should appear');
    });
  });

  describe('setLogLevel', () => {
    it('should change log level dynamically', () => {
      const logger = new Logger(LogLevel.INFO);

      logger.debug('should not appear');
      expect(consoleDebugSpy).not.toHaveBeenCalled();

      logger.setLogLevel(LogLevel.DEBUG);
      logger.debug('should appear now');
      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] should appear now');
    });

    it('should silence all logs when set to SILENT', () => {
      const logger = new Logger();
      logger.setLogLevel(LogLevel.SILENT);

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should log debug messages when level is DEBUG', () => {
      const logger = new Logger(LogLevel.DEBUG);
      logger.debug('debug message', { foo: 'bar' });

      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] debug message', { foo: 'bar' });
    });

    it('should not log debug messages when level is INFO or higher', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.debug('debug message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple arguments', () => {
      const logger = new Logger(LogLevel.DEBUG);
      logger.debug('message', 'arg1', 'arg2', { key: 'value' });

      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] message', 'arg1', 'arg2', {
        key: 'value',
      });
    });

    it('should handle no additional arguments', () => {
      const logger = new Logger(LogLevel.DEBUG);
      logger.debug('message only');

      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] message only');
    });
  });

  describe('info', () => {
    it('should log info messages when level is INFO or lower', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.info('info message', { data: 123 });

      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] info message', { data: 123 });
    });

    it('should log info messages when level is DEBUG', () => {
      const logger = new Logger(LogLevel.DEBUG);
      logger.info('info message');

      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] info message');
    });

    it('should not log info messages when level is WARN or higher', () => {
      const logger = new Logger(LogLevel.WARN);
      logger.info('info message');

      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple arguments', () => {
      const logger = new Logger(LogLevel.INFO);
      logger.info('message', 1, 2, 3);

      expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] message', 1, 2, 3);
    });
  });

  describe('warn', () => {
    it('should log warn messages when level is WARN or lower', () => {
      const logger = new Logger(LogLevel.WARN);
      logger.warn('warning message', { warning: true });

      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warning message', { warning: true });
    });

    it('should log warn messages when level is DEBUG or INFO', () => {
      const loggerDebug = new Logger(LogLevel.DEBUG);
      const loggerInfo = new Logger(LogLevel.INFO);

      loggerDebug.warn('warn1');
      loggerInfo.warn('warn2');

      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warn1');
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warn2');
    });

    it('should not log warn messages when level is ERROR or higher', () => {
      const logger = new Logger(LogLevel.ERROR);
      logger.warn('warning message');

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple arguments', () => {
      const logger = new Logger(LogLevel.WARN);
      logger.warn('warning', 'details', { code: 'WARN01' });

      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] warning', 'details', { code: 'WARN01' });
    });
  });

  describe('error', () => {
    it('should log error messages at ERROR level', () => {
      const logger = new Logger(LogLevel.ERROR);
      logger.error('error message', { stack: 'trace' });

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error message', { stack: 'trace' });
    });

    it('should log error messages at any level except SILENT', () => {
      const loggerDebug = new Logger(LogLevel.DEBUG);
      const loggerInfo = new Logger(LogLevel.INFO);
      const loggerWarn = new Logger(LogLevel.WARN);
      const loggerError = new Logger(LogLevel.ERROR);

      loggerDebug.error('error1');
      loggerInfo.error('error2');
      loggerWarn.error('error3');
      loggerError.error('error4');

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error1');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error2');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error3');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] error4');
    });

    it('should not log error messages when level is SILENT', () => {
      const logger = new Logger(LogLevel.SILENT);
      logger.error('error message');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple arguments', () => {
      const logger = new Logger(LogLevel.ERROR);
      const errorObj = new Error('test error');
      logger.error('critical', errorObj, { code: 500 });

      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] critical', errorObj, { code: 500 });
    });
  });

  describe('log level hierarchy', () => {
    it('should respect DEBUG level (logs everything)', () => {
      const logger = new Logger(LogLevel.DEBUG);

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect INFO level (logs info, warn, error)', () => {
      const logger = new Logger(LogLevel.INFO);

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect WARN level (logs warn, error)', () => {
      const logger = new Logger(LogLevel.WARN);

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect ERROR level (logs only error)', () => {
      const logger = new Logger(LogLevel.ERROR);

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect SILENT level (logs nothing)', () => {
      const logger = new Logger(LogLevel.SILENT);

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('exported logger instance', () => {
    it('should be importable and usable', async () => {
      const { logger } = await import('./logger.js');
      expect(logger).toBeDefined();
      expect(logger.debug).toBeTypeOf('function');
      expect(logger.info).toBeTypeOf('function');
      expect(logger.warn).toBeTypeOf('function');
      expect(logger.error).toBeTypeOf('function');
      expect(logger.setLogLevel).toBeTypeOf('function');
    });
  });
});
