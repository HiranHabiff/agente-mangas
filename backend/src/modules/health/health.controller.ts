import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { healthContract } from '../../contracts/custom/health.contract';
import { HealthService } from './health.service';

@Controller()
@ApiTags('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @TsRestHandler(healthContract)
  async handler() {
    return tsRestHandler(healthContract, {
      check: async () => {
        const health = await this.healthService.getBasicHealth();
        return {
          status: 200 as const,
          body: health,
        };
      },

      detailed: async () => {
        const health = await this.healthService.getDetailedHealth();
        const status = health.status === 'healthy' ? (200 as const) : (503 as const);
        return {
          status,
          body: health,
        };
      },

      database: async () => {
        const dbHealth = await this.healthService.getDatabaseHealth();
        const status = dbHealth.status === 'connected' ? (200 as const) : (503 as const);
        return {
          status,
          body: dbHealth,
        };
      },

      readiness: async () => {
        const readiness = await this.healthService.getReadiness();
        if (readiness.ready) {
          return {
            status: 200 as const,
            body: {
              ready: readiness.ready,
              services: readiness.services,
            },
          };
        } else {
          return {
            status: 503 as const,
            body: {
              ready: readiness.ready,
              services: readiness.services,
              message: readiness.message || 'Some services are not ready',
            },
          };
        }
      },

      liveness: async () => {
        const liveness = await this.healthService.getLiveness();
        return {
          status: 200 as const,
          body: liveness,
        };
      },
    });
  }
}
