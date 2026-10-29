import { MigrationInterface, QueryRunner } from 'typeorm';

export class InstrumentsTrigramSearch1793262000000 implements MigrationInterface {
  name = 'InstrumentsTrigramSearch1793262000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    await queryRunner.query(
      `CREATE INDEX "instruments_ticker_trgm_idx" ON "instruments" USING GIN ("ticker" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX "instruments_name_trgm_idx" ON "instruments" USING GIN ("name" gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."instruments_name_trgm_idx"`);
    await queryRunner.query(`DROP INDEX "public"."instruments_ticker_trgm_idx"`);
  }
}
