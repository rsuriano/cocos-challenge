import { registerAs } from '@nestjs/config';
import { requireEnv } from '../../../utils/require-env';

export interface PostgresEnvironment {
  url: string;
  ssl: boolean;
}

export const postgresEnvironment = 'postgres';

export default registerAs(postgresEnvironment, (): PostgresEnvironment => ({
  url: requireEnv('POSTGRES_URL'),
  // true for RDS; the local Docker Postgres has no SSL.
  ssl: process.env.POSTGRES_SSL === 'true',
}));
