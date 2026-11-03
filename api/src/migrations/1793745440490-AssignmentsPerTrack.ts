import { MigrationInterface, QueryRunner } from "typeorm";

export class AssignmentsPerTrack1793745440490 implements MigrationInterface {
    name = 'AssignmentsPerTrack1793745440490'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignments" ADD "isCapstone" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD "programId" uuid`);
        await queryRunner.query(`ALTER TABLE "assignments" ADD CONSTRAINT "FK_7e23342084e45467ee9b8457673" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // Older assignments: a cohort with a single track gets them moved onto that track.
        // Cohorts with several tracks keep them cohort-wide (shown to every track, as before).
        await queryRunner.query(`
            UPDATE "assignments" a SET "programId" = p.id
            FROM "programs" p
            WHERE a."programId" IS NULL AND p."cohortId" = a."cohortId"
              AND (SELECT COUNT(*) FROM "programs" p2 WHERE p2."cohortId" = a."cohortId") = 1`);
        // The old capstone guess was "title contains capstone"; keep that as the flag (latest one per track).
        await queryRunner.query(`
            UPDATE "assignments" SET "isCapstone" = true WHERE id IN (
              SELECT DISTINCT ON ("programId") id FROM "assignments"
              WHERE "programId" IS NOT NULL AND LOWER(title) LIKE '%capstone%'
              ORDER BY "programId", "dueDate" DESC)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "assignments" DROP CONSTRAINT "FK_7e23342084e45467ee9b8457673"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP COLUMN "programId"`);
        await queryRunner.query(`ALTER TABLE "assignments" DROP COLUMN "isCapstone"`);
    }

}
