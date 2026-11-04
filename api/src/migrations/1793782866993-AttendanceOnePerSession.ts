import { MigrationInterface, QueryRunner } from "typeorm";

export class AttendanceOnePerSession1793782866993 implements MigrationInterface {
    name = 'AttendanceOnePerSession1793782866993'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Earlier saves could add a second row for the same learner and session; keep the newest.
        await queryRunner.query(`
            DELETE FROM "attendances" a USING "attendances" b
            WHERE a."sessionId" = b."sessionId" AND a."learnerId" = b."learnerId"
              AND (a."markedAt", a.id) < (b."markedAt", b.id)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_attendance_session_learner" ON "attendances" ("sessionId", "learnerId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_attendance_session_learner"`);
    }

}
