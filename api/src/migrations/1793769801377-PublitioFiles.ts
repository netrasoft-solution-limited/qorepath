import { MigrationInterface, QueryRunner } from "typeorm";

export class PublitioFiles1793769801377 implements MigrationInterface {
    name = 'PublitioFiles1793769801377'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "certificates" ADD "fileUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "certificates" ADD "fileStorageId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "avatarStorageId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatarStorageId"`);
        await queryRunner.query(`ALTER TABLE "certificates" DROP COLUMN "fileStorageId"`);
        await queryRunner.query(`ALTER TABLE "certificates" DROP COLUMN "fileUrl"`);
    }

}
