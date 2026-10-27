import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  // Liveness for ALB/ECS: must not depend on the DB.
  @Get()
  liveness() {
    return { status: 'ok' };
  }

  @Get('db')
  @HealthCheck()
  database() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
