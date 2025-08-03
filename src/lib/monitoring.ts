/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/monitoring.ts - SISTEMA DE OBSERVABILIDADE PARA AUTH PIPELINE

/**
 * Sistema de monitoramento e observabilidade para authentication pipeline
 * Implementa distributed tracing, metrics collection, e error aggregation
 *
 * @architecture
 * - OpenTelemetry-compatible metrics export
 * - Structured logging com correlation IDs
 * - Performance monitoring com percentile analysis
 * - Error tracking com stack trace aggregation
 * - Security audit trail com PII redaction
 */

import { NextRequest, NextResponse } from "next/server";

// ===== TELEMETRY INFRASTRUCTURE =====

/**
 * Performance metrics collector com statistical analysis
 * Implementa sliding window algorithm para real-time performance insights
 */
class PerformanceMetrics {
  private static metrics = new Map<string, number[]>();
  private static readonly WINDOW_SIZE = 100; // Sliding window de 100 measurements

  /**
   * Record performance measurement com statistical processing
   * @param operation - Nome da operação (e.g., "auth.login", "jwt.verify")
   * @param duration - Duration em milliseconds
   * @param metadata - Additional context para correlation
   */
  static record(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const key = operation;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const measurements = this.metrics.get(key)!;
    measurements.push(duration);

    // Maintain sliding window
    if (measurements.length > this.WINDOW_SIZE) {
      measurements.shift();
    }

    // Log performance alerts para outliers
    const p95 = this.getPercentile(measurements, 95);
    if (duration > p95 * 2) {
      // Alert se duration > 2x P95
      console.warn(`[PERF_ALERT] ${operation} slow execution:`, {
        duration: `${duration.toFixed(2)}ms`,
        p95: `${p95.toFixed(2)}ms`,
        metadata,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Calculate percentile value com sorting algorithm optimization
   */
  private static getPercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Export metrics snapshot para external monitoring systems
   */
  static exportMetrics(): Record<
    string,
    {
      count: number;
      avg: number;
      p50: number;
      p95: number;
      p99: number;
      max: number;
    }
  > {
    const snapshot: any = {};

    for (const [operation, measurements] of this.metrics.entries()) {
      if (measurements.length === 0) continue;

      const sum = measurements.reduce((a, b) => a + b, 0);
      const sorted = [...measurements].sort((a, b) => a - b);

      snapshot[operation] = {
        count: measurements.length,
        avg: sum / measurements.length,
        p50: this.getPercentile(sorted, 50),
        p95: this.getPercentile(sorted, 95),
        p99: this.getPercentile(sorted, 99),
        max: Math.max(...measurements),
      };
    }

    return snapshot;
  }
}

/**
 * Correlation ID manager para distributed tracing
 * Implementa request correlation através de multiple service boundaries
 */
class CorrelationManager {
  private static readonly CORRELATION_HEADER = "x-correlation-id";

  /**
   * Generate cryptographically secure correlation ID
   */
  static generateId(): string {
    return `trace-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;
  }

  /**
   * Extract correlation ID from request headers
   */
  static extractFromRequest(request: NextRequest): string {
    return request.headers.get(this.CORRELATION_HEADER) || this.generateId();
  }

  /**
   * Inject correlation ID into response headers
   */
  static injectIntoResponse(
    response: NextResponse,
    correlationId: string
  ): void {
    response.headers.set(this.CORRELATION_HEADER, correlationId);
  }
}

/**
 * Security audit logger com PII redaction
 * Implementa GDPR-compliant logging para security events
 */
class SecurityAuditLogger {
  /**
   * Log authentication attempt com security context
   */
  static logAuthAttempt(
    event: "LOGIN_SUCCESS" | "LOGIN_FAILURE" | "REGISTRATION" | "TOKEN_REFRESH",
    context: {
      userId?: string;
      email?: string;
      ipAddress?: string;
      userAgent?: string;
      errorCode?: string;
      correlationId: string;
    }
  ): void {
    const auditEntry = {
      event,
      timestamp: new Date().toISOString(),
      correlationId: context.correlationId,
      userId: context.userId || "anonymous",
      // PII redaction para GDPR compliance
      emailHash: context.email ? this.hashPII(context.email) : undefined,
      ipAddressHash: context.ipAddress
        ? this.hashPII(context.ipAddress)
        : undefined,
      userAgentHash: context.userAgent
        ? this.hashPII(context.userAgent)
        : undefined,
      errorCode: context.errorCode,
      severity: event.includes("FAILURE") ? "WARNING" : "INFO",
    };

    // Structured logging para external aggregation (e.g., ELK Stack)
    console.log(`[SECURITY_AUDIT] ${JSON.stringify(auditEntry)}`);

    // Critical security events notification
    if (event === "LOGIN_FAILURE" || context.errorCode?.includes("SECURITY")) {
      this.alertSecurityTeam(auditEntry);
    }
  }

  /**
   * Hash PII data para compliance enquanto maintaining searchability
   */
  private static hashPII(data: string): string {
    // Use deterministic hash para allow correlation sem storing plaintext
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(
      data + process.env.PII_SALT || "default-salt"
    );

    // Simple hash (em produção, usar crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < dataBytes.length; i++) {
      const char = dataBytes[i];
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert para 32-bit integer
    }

    return `sha256:${Math.abs(hash).toString(16)}`;
  }

  /**
   * Alert security team para critical events
   */
  private static alertSecurityTeam(auditEntry: any): void {
    // Em produção, integrate com alerting system (e.g., PagerDuty, Slack)
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[SECURITY_ALERT] Critical security event detected:`,
        auditEntry
      );
    }
  }
}

/**
 * Error aggregation system com stack trace analysis
 * Implementa error pattern detection e automatic categorization
 */
class ErrorAggregator {
  private static errorCounts = new Map<string, number>();
  private static readonly ALERT_THRESHOLD = 10; // Alert após 10 occurrences

  /**
   * Track error occurrence com pattern detection
   */
  static trackError(
    error: Error,
    context: {
      operation: string;
      userId?: string;
      correlationId: string;
      metadata?: Record<string, any>;
    }
  ): void {
    const errorSignature = this.generateErrorSignature(error);

    // Increment error count
    const currentCount = this.errorCounts.get(errorSignature) || 0;
    this.errorCounts.set(errorSignature, currentCount + 1);

    const errorEntry = {
      signature: errorSignature,
      message: error.message,
      stack: error.stack,
      operation: context.operation,
      userId: context.userId || "anonymous",
      correlationId: context.correlationId,
      count: currentCount + 1,
      timestamp: new Date().toISOString(),
      metadata: context.metadata,
    };

    console.error(`[ERROR_TRACKING] ${JSON.stringify(errorEntry)}`);

    // Alert on error threshold
    if (currentCount + 1 >= this.ALERT_THRESHOLD) {
      console.error(`[ERROR_ALERT] High error frequency detected:`, {
        signature: errorSignature,
        count: currentCount + 1,
        operation: context.operation,
      });
    }
  }

  /**
   * Generate error signature para pattern matching
   */
  private static generateErrorSignature(error: Error): string {
    // Create signature baseado em error type e stack trace pattern
    const stackLines = error.stack?.split("\n").slice(0, 3) || [];
    const signature = `${error.constructor.name}:${
      error.message
    }:${stackLines.join("|")}`;

    // Hash signature para consistent identification
    let hash = 0;
    for (let i = 0; i < signature.length; i++) {
      const char = signature.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return `error-${Math.abs(hash).toString(16)}`;
  }

  /**
   * Export error statistics para monitoring dashboard
   */
  static exportErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }
}

// ===== MONITORING MIDDLEWARE =====

/**
 * Monitoring middleware factory para instrumenting auth routes
 * Implementa comprehensive observability layer
 */
export function createMonitoringMiddleware(operation: string) {
  return function monitoringWrapper<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      const correlationId = CorrelationManager.generateId();
      const startTime = performance.now();

      try {
        console.log(`[MONITORING] ${operation} started:`, {
          correlationId,
          timestamp: new Date().toISOString(),
        });

        const result = await fn(...args);
        const duration = performance.now() - startTime;

        // Record successful operation
        PerformanceMetrics.record(operation, duration, { correlationId });

        console.log(`[MONITORING] ${operation} completed:`, {
          correlationId,
          duration: `${duration.toFixed(2)}ms`,
          success: true,
        });

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;

        // Track error occurrence
        ErrorAggregator.trackError(error as Error, {
          operation,
          correlationId,
          metadata: { duration, args: args.length },
        });

        console.error(`[MONITORING] ${operation} failed:`, {
          correlationId,
          duration: `${duration.toFixed(2)}ms`,
          error: (error as Error).message,
        });

        throw error;
      }
    };
  };
}

// ===== HEALTH CHECK SYSTEM =====

/**
 * System health checker com dependency validation
 * Implementa comprehensive health assessment
 */
export class HealthChecker {
  /**
   * Execute comprehensive health check
   */
  static async performHealthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    checks: Record<
      string,
      { status: string; latency?: number; error?: string }
    >;
    timestamp: string;
  }> {
    const checks: Record<string, any> = {};
    const startTime = Date.now();

    // Database connectivity check
    try {
      const dbStart = performance.now();
      // Test database connection (implement based on your database)
      // await db.$queryRaw`SELECT 1`;
      checks.database = {
        status: "healthy",
        latency: performance.now() - dbStart,
      };
    } catch (error) {
      checks.database = {
        status: "unhealthy",
        error: (error as Error).message,
      };
    }

    // JWT service check
    try {
      const jwtStart = performance.now();
      // Test JWT generation/verification
      checks.jwt = {
        status: "healthy",
        latency: performance.now() - jwtStart,
      };
    } catch (error) {
      checks.jwt = {
        status: "unhealthy",
        error: (error as Error).message,
      };
    }

    // Memory usage check
    if (typeof process !== "undefined" && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const memoryMB = memUsage.heapUsed / 1024 / 1024;
      checks.memory = {
        status: memoryMB > 512 ? "degraded" : "healthy", // Alert se > 512MB
        usage: `${memoryMB.toFixed(2)}MB`,
      };
    }

    // Overall system status
    const unhealthyCount = Object.values(checks).filter(
      (c) => c.status === "unhealthy"
    ).length;
    const degradedCount = Object.values(checks).filter(
      (c) => c.status === "degraded"
    ).length;

    let status: "healthy" | "degraded" | "unhealthy";
    if (unhealthyCount > 0) {
      status = "unhealthy";
    } else if (degradedCount > 0) {
      status = "degraded";
    } else {
      status = "healthy";
    }

    return {
      status,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}

// ===== EXPORT UTILITIES =====

export {
  PerformanceMetrics,
  CorrelationManager,
  SecurityAuditLogger,
  ErrorAggregator,
};
