import { MigrationInterface, QueryRunner } from 'typeorm';

// Schema provided by the challenge, as it exists in Neon. IF NOT EXISTS makes it
// a no-op there and recreates the same schema on an empty local database.
export class Baseline1793160000000 implements MigrationInterface {
  name = 'Baseline1793160000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "users" ("id" SERIAL NOT NULL, "email" character varying(255), "accountnumber" character varying(20), CONSTRAINT "users_pkey" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "instruments" ("id" SERIAL NOT NULL, "ticker" character varying(10), "name" character varying(255), "type" character varying(10), CONSTRAINT "instruments_pkey" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "marketdata" ("id" SERIAL NOT NULL, "instrumentid" integer, "high" numeric(10,2), "low" numeric(10,2), "open" numeric(10,2), "close" numeric(10,2), "previousclose" numeric(10,2), "date" date, CONSTRAINT "marketdata_pkey" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "orders" ("id" SERIAL NOT NULL, "instrumentid" integer, "userid" integer, "size" integer, "price" numeric(10,2), "type" character varying(10), "side" character varying(10), "status" character varying(20), "datetime" TIMESTAMP, CONSTRAINT "orders_pkey" PRIMARY KEY ("id"))`,
    );
  }

  public async down(): Promise<void> {
    // Reverting would drop the challenge's tables and data.
    throw new Error('The baseline migration cannot be reverted');
  }
}
