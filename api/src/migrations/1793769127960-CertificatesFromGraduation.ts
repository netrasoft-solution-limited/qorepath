import { MigrationInterface, QueryRunner } from "typeorm";

export class CertificatesFromGraduation1793769127960 implements MigrationInterface {
    name = 'CertificatesFromGraduation1793769127960'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "certificates" ADD "fileName" character varying`);
        await queryRunner.query(`ALTER TABLE "certificates" ADD "fileType" character varying`);
        await queryRunner.query(`ALTER TABLE "certificates" ADD "fileSize" integer`);
        await queryRunner.query(`ALTER TABLE "certificates" ADD "fileData" bytea`);
        await queryRunner.query(`ALTER TABLE "certificates" ADD "enrollmentId" uuid`);
        await queryRunner.query(`ALTER TABLE "certificates" ADD CONSTRAINT "FK_23287b04f9c0072b935a2abd6fc" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        // Link existing certificates to the learner's enrollment in that cohort, where there's exactly one.
        await queryRunner.query(`
            UPDATE "certificates" c SET "enrollmentId" = e.id
            FROM "enrollments" e JOIN "programs" p ON p.id = e."programId"
            WHERE c."enrollmentId" IS NULL AND e."learnerId" = c."userId" AND p."cohortId" = c."cohortId"
              AND (SELECT COUNT(*) FROM "enrollments" e2 JOIN "programs" p2 ON p2.id = e2."programId"
                   WHERE e2."learnerId" = c."userId" AND p2."cohortId" = c."cohortId") = 1
              AND (SELECT COUNT(*) FROM "certificates" c2 WHERE c2."userId" = c."userId" AND c2."cohortId" = c."cohortId") = 1`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_certificates_enrollment" ON "certificates" ("enrollmentId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_certificates_enrollment"`);
        await queryRunner.query(`ALTER TABLE "certificates" DROP CONSTRAINT "FK_23287b04f9c0072b935a2abd6fc"`);
        await queryRunner.query(`ALTER TABLE "certificates" DROP COLUMN "enrollmentId"`);
        await queryRunner.query(`ALTER TABLE "certificates" DROP COLUMN "fileData"`);
        await queryRunner.query(`ALTER TABLE "certificates" DROP COLUMN "fileSize"`);
        await queryRunner.query(`ALTER TABLE "certificates" DROP COLUMN "fileType"`);
        await queryRunner.query(`ALTER TABLE "certificates" DROP COLUMN "fileName"`);
    }

}
