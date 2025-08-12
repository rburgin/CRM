import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Span, Tracer, PerformanceMonitor, Logger } from '../telemetry';

describe('Telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Span', () => {
    it('should create span with correct properties', () => {
      const span = new Span('test-operation');
      const context = span.getContext();

      expect(context.operation).toBe('test-operation');
      expect(context.traceId).toBeDefined();
      expect(context.spanId).toBeDefined();
      expect(context.startTime).toBeGreaterThan(0);
    });

    it('should set tags correctly', () => {
      const span = new Span('test-operation');
      span.setTag('key1', 'value1');
      span.setTags({ key2: 'value2', key3: 123 });

      const context = span.getContext();
      expect(context.tags).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 123,
      });
    });

    it('should log messages with correct structure', () => {
      const span = new Span('test-operation');
      span.log('info', 'Test message', { field1: 'value1' });

      const context = span.getContext();
      expect(context.logs).toHaveLength(1);
      expect(context.logs[0]).toMatchObject({
        level: 'info',
        message: 'Test message',
        fields: { field1: 'value1' },
      });
    });

    it('should return duration when finished', () => {
      const span = new Span('test-operation');
      const duration = span.finish();

      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('PerformanceMonitor', () => {
    it('should record measurements', () => {
      PerformanceMonitor.record('test-operation', 100, { tag1: 'value1' });
      
      const stats = PerformanceMonitor.getStats('test-operation');
      expect(stats.count).toBe(1);
      expect(stats.avg).toBe(100);
    });

    it('should calculate P95 correctly', () => {
      // Record multiple measurements
      for (let i = 1; i <= 100; i++) {
        PerformanceMonitor.record('test-p95', i);
      }

      const p95 = PerformanceMonitor.getP95('test-p95');
      expect(p95).toBe(95);
    });

    it('should return null for unknown operations', () => {
      const p95 = PerformanceMonitor.getP95('unknown-operation');
      expect(p95).toBeNull();
    });
  });

  describe('Logger', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = {
        debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
        info: vi.spyOn(console, 'info').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      };
    });

    it('should log with correct structure', () => {
      const logger = new Logger({ requestId: 'test-request', orgId: 'test-org' });
      logger.info('Test message', { extra: 'data' });

      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"level":"info"')
      );
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test message"')
      );
    });

    it('should mask PII in logs', () => {
      const logger = new Logger({ requestId: 'test-request' });
      logger.info('User data', { email: 'user@example.com', phone: '123-456-7890' });

      const logCall = consoleSpy.info.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData.email).toBe('***MASKED***');
      expect(logData.phone).toBe('***MASKED***');
    });

    it('should create child logger with additional context', () => {
      const parentLogger = new Logger({ requestId: 'test-request' });
      const childLogger = parentLogger.child({ userId: 'test-user' });
      
      childLogger.info('Child message');

      const logCall = consoleSpy.info.mock.calls[0][0];
      const logData = JSON.parse(logCall);
      
      expect(logData.requestId).toBe('test-request');
      expect(logData.userId).toBe('test-user');
    });
  });
});