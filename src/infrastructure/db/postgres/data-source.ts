import { join } from 'node:path';
import { DataSource } from 'typeorm';
import envConfig from './env.config';

// Connection for the TypeORM CLI (migrations), which runs outside Nest.
const config = envConfig();

export default new DataSource({
  type: 'postgres',
  url: config.url,
  ssl: config.ssl,
  // .ts when run from src (dev), .js when run from dist (prod).
  entities: [join(__dirname, '../../../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
  synchronize: false,
});
