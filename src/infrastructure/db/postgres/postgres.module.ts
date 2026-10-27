import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import envConfig, { PostgresEnvironment, postgresEnvironment } from './env.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(envConfig)],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.getOrThrow<PostgresEnvironment>(postgresEnvironment);

        return {
          type: 'postgres',
          url: config.url,
          ssl: config.ssl,
          autoLoadEntities: true,
          synchronize: false,
        };
      },
    }),
  ],
})
export class PostgresModule {}
