import { MigrationInterface, QueryRunner } from "typeorm";

export class InstalmentReminders1793778857767 implements MigrationInterface {
    name = 'InstalmentReminders1793778857767'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ADD "remindersSent" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "lastReminderAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "lastReminderAt"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "remindersSent"`);
    }

}
