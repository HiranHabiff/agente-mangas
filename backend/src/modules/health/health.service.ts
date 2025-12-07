import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class HealthService {
  private startTime: number;

  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {
    this.startTime = Date.now();
  }

  async getBasicHealth() {
    return {
      status: 'healthy' as const,
      timestamp: new Date(),
      uptime: this.getUptime(),
      version: process.env.npm_package_version || '2.0.0',
    };
  }

  async getDetailedHealth() {
    const dbHealth = await this.getDatabaseHealth();
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;

    return {
      status: dbHealth.status === 'connected' ? ('healthy' as const) : ('degraded' as const),
      timestamp: new Date(),
      uptime: this.getUptime(),
      version: process.env.npm_package_version || '2.0.0',
      services: {
        database: dbHealth,
        ai: {
          status: process.env.GEMINI_API_KEY ? ('available' as const) : ('unavailable' as const),
          last_request: null,
        },
      },
      system: {
        memory: {
          used: usedMemory,
          total: totalMemory,
          percentage: (usedMemory / totalMemory) * 100,
        },
      },
    };
  }

  async getDatabaseHealth() {
    const startTime = Date.now();
    try {
      await this.sequelize.authenticate();
      const responseTime = Date.now() - startTime;

      const pool = (this.sequelize as any).connectionManager?.pool;
      const poolInfo = pool
        ? {
            total: pool.size || 0,
            active: pool.borrowed || 0,
            idle: pool.available || 0,
          }
        : undefined;

      return {
        status: 'connected' as const,
        response_time_ms: responseTime,
        connection_pool: poolInfo,
      };
    } catch (error) {
      return {
        status: 'error' as const,
        response_time_ms: Date.now() - startTime,
        connection_pool: undefined,
      };
    }
  }

  async getReadiness() {
    const dbHealth = await this.getDatabaseHealth();
    const aiAvailable = !!process.env.GEMINI_API_KEY;

    const ready = dbHealth.status === 'connected' && aiAvailable;

    if (ready) {
      return {
        ready: true,
        services: {
          database: true,
          ai: true,
        },
      };
    }

    return {
      ready: false,
      services: {
        database: dbHealth.status === 'connected',
        ai: aiAvailable,
      },
      message: 'Some services are not ready',
    };
  }

  async getLiveness() {
    return {
      alive: true,
      uptime: this.getUptime(),
    };
  }

  private getUptime(): number {
    return (Date.now() - this.startTime) / 1000; // seconds
  }
}
