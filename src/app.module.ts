import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostgresModule } from './infrastructure/db/postgres/postgres.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { HealthModule } from './modules/health/health.module';
import { MarketModule } from './modules/market/market.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggingModule,
    PostgresModule,
    HealthModule,
    MarketModule,
  ],
})
export class AppModule {}
