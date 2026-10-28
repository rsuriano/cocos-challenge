import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1793168055996 implements MigrationInterface {
  name = 'Migration1793168055996';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "marketdata_instrumentid_date_idx" ON "marketdata"  ("instrumentid", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "orders_userid_instrumentid_idx" ON "orders"  ("userid", "instrumentid") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."orders_userid_instrumentid_idx"`);
    await queryRunner.query(`DROP INDEX "public"."marketdata_instrumentid_date_idx"`);
  }
}
