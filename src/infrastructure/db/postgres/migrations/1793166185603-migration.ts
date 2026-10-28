import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1793166185603 implements MigrationInterface {
    name = 'Migration1793166185603'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "marketdata" ADD CONSTRAINT "FK_ebc100dd8ce970a0eeb7b2a1355" FOREIGN KEY ("instrumentid") REFERENCES "instruments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_bd6f726c31531782afc70c2365d" FOREIGN KEY ("instrumentid") REFERENCES "instruments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_5f3e2f530c164243c140e751c51" FOREIGN KEY ("userid") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_5f3e2f530c164243c140e751c51"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_bd6f726c31531782afc70c2365d"`);
        await queryRunner.query(`ALTER TABLE "marketdata" DROP CONSTRAINT "FK_ebc100dd8ce970a0eeb7b2a1355"`);
    }

}
