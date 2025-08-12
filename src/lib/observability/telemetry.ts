// Telemetry and observability utilities
import { v4 as uuidv4 } from 'uuid';

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  tags: Record<string, string | number | boolean>;
  logs: Array<{
    timestamp: number;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    fields?: Record<string, any>;
  }>;
}

export class Span {
  private context: SpanContext;
  private finished = false;

  constructor(operation: string, parentSpan?: Span) {
    this.context = {
      traceId: parentSpan?.context.traceId || uuidv4(),
      spanId: uuidv4(),
      parentSpanId: parentSpan?.context.spanId,
      operation,
      startTime: performance.now(),
      tags: {},
      logs: [],
    };
  }

  setTag(key: string, value: string | number | boolean): this {
    this.context.tags[key] = value;
    return this;
  }

  setTags(tags: Record<string, string | number | boolean>): this {
    Object.assign(this.context.tags, tags);
    return this;
  }

  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, fields?: Record<string, any>): this {
    this.context.logs.push({
      timestamp: performance.now(),
      level,
      message,
      fields,
    });
    return this;
  }

  finish(): number {
    if (this.finished) {
      console.warn('Span already finished:', this.context.operation);
      return 0;
    }

    const duration = performance.now() - this.context.startTime;
    this.finished = true;

    // Log span completion
    console.log('Span completed:', {
      operation: this.context.operation,
      duration: `${duration.toFixed(2)}ms`,
      traceId: this.context.traceId,
      spanId: this.context.spanId,
      tags: this.context.tags,
      logs: this.context.logs,
    });

    return duration;
  }

  getContext(): SpanContext {
    return { ...this.context };
  }
}

export class Tracer {
  startSpan(operation: string, parentSpan?: Span): Span {
    return new Span(operation, parentSpan);
  }
}

// Global tracer instance
export const tracer = new Tracer();

// Performance monitoring
export class PerformanceMonitor {
  private static measurements: Array<{
    operation: string;
    duration: number;
    timestamp: number;
    tags: Record<string, any>;
  }> = [];

  static record(operation: string, duration: number, tags: Record<string, any> = {}) {
    this.measurements.push({
      operation,
      duration,
      timestamp: Date.now(),
      tags,
    });

    // Keep only last 1000 measurements
    if (this.measurements.length > 1000) {
      this.measurements = this.measurements.slice(-1000);
    }
  }

  static getP95(operation: string, timeWindowMs = 300000): number | null {
    const cutoff = Date.now() - timeWindowMs;
    const filtered = this.measurements
      .filter(m => m.operation === operation && m.timestamp > cutoff)
      .map(m => m.duration)
      .sort((a, b) => a - b);

    if (filtered.length === 0) return null;

    const p95Index = Math.ceil(filtered.length * 0.95) - 1;
    return filtered[p95Index];
  }

  static getStats(operation: string, timeWindowMs = 300000) {
    const cutoff = Date.now() - timeWindowMs;
    const filtered = this.measurements
      .filter(m => m.operation === operation && m.timestamp > cutoff)
      .map(m => m.duration);

    if (filtered.length === 0) {
      return { count: 0, min: 0, max: 0, avg: 0, p95: 0 };
    }

    const sorted = [...filtered].sort((a, b) => a - b);
    const sum = filtered.reduce((a, b) => a + b, 0);

    return {
      count: filtered.length,
      min: Math.min(...filtered),
      max: Math.max(...filtered),
      avg: sum / filtered.length,
      p95: sorted[Math.ceil(sorted.length * 0.95) - 1] || 0,
    };
  }
}

// Structured logging
export interface LogContext {
  requestId: string;
  orgId?: string;
  userId?: string;
  operation?: string;
  [key: string]: any;
}

export class Logger {
  private context: LogContext;

  constructor(context: LogContext) {
    this.context = context;
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, extra: Record<string, any> = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...extra,
    };

    // Mask PII in logs
    const maskedEntry = this.maskPII(logEntry);

    console[level](JSON.stringify(maskedEntry));
  }

  private maskPII(obj: any): any {
    const piiFields = ['email', 'phone', 'ssn', 'credit_card', 'password'];
    const masked = { ...obj };

    for (const field of piiFields) {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    }

    return masked;
  }

  debug(message: string, extra?: Record<string, any>) {
    this.log('debug', message, extra);
  }

  info(message: string, extra?: Record<string, any>) {
    this.log('info', message, extra);
  }

  warn(message: string, extra?: Record<string, any>) {
    this.log('warn', message, extra);
  }

  error(message: string, extra?: Record<string, any>) {
    this.log('error', message, extra);
  }

  child(additionalContext: Record<string, any>): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }
}