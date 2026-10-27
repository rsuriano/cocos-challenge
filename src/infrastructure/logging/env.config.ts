import { registerAs } from '@nestjs/config';

export interface LoggingEnvironment {
  environment: string;
  level: string;
}

export const loggingEnvironment = 'logging';

export default registerAs(loggingEnvironment, (): LoggingEnvironment => ({
  environment: process.env.NODE_ENV ?? 'development',
  level: process.env.LOG_LEVEL ?? 'info',
}));
