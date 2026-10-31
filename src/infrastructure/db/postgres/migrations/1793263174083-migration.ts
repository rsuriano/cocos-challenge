import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1793263174083 implements MigrationInterface {
  name = 'Migration1793263174083';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" ADD "idempotencykey" uuid`);
    await queryRunner.query(`ALTER TABLE "orders" ADD "rejectionreason" character varying(30)`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "orders_userid_idempotencykey_key" ON "orders"  ("userid", "idempotencykey") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."orders_userid_idempotencykey_key"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "rejectionreason"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "idempotencykey"`);
  }
}
