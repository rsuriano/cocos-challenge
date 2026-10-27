import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import envConfig, { LoggingEnvironment, loggingEnvironment } from './env.config';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule.forFeature(envConfig)],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.getOrThrow<LoggingEnvironment>(loggingEnvironment);
        const isDevelopment = config.environment === 'development';

        return {
          pinoHttp: {
            level: config.level,
            autoLogging: { ignore: req => req.url === '/health' },
            formatters: { level: label => ({ level: label }) },
            transport: isDevelopment
              ? { target: 'pino-pretty', options: { singleLine: true, translateTime: 'HH:MM:ss' } }
              : undefined,
          },
        };
      },
    }),
  ],
})
export class LoggingModule {}
