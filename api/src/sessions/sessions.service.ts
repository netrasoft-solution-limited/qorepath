import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Session } from './session.entity';
import { Attendance, AttendanceStatus } from './attendance.entity';
import { Enrollment, EnrollmentStatus } from '../enrollments/enrollment.entity';
import { User } from '../users/user.entity';
import { JaasService } from './jaas.service';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Attendance) private attendanceRepo: Repository<Attendance>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private jaas: JaasService,
    private config: ConfigService,
  ) {}

  private roomName(sessionId: string) {
    return `qorepath${sessionId.replace(/-/g, '')}`;
  }

  /** Reverse of roomName: 'qorepath<32hex>' (optionally 'appId/qorepath…') → uuid. */
  private roomToSessionId(roomOrFqn?: string): string | null {
    if (!roomOrFqn) return null;
    const room = roomOrFqn.includes('/') ? roomOrFqn.split('/').pop()! : roomOrFqn;
    if (!room.startsWith('qorepath')) return null;
    const hex = room.slice('qorepath'.length);
    if (!/^[0-9a-fA-F]{32}$/.test(hex)) return null;
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  /**
   * Public webhook from 8x8 JaaS. On a recording-ready event it saves the
   * download link onto the matching session automatically.
   */
  async handleRecordingWebhook(body: any, secretProvided?: string) {
    const required = this.config.get<string>('JAAS_WEBHOOK_SECRET');
    if (required && secretProvided !== required) {
      throw new ForbiddenException('Invalid webhook secret');
    }

    const eventType: string = body?.eventType ?? body?.event ?? '';
    const data = body?.data ?? body ?? {};
    // Field names vary across JaaS payload versions — probe the common ones.
    const link =
      data.preAuthenticatedLink ?? data.url ?? data.link ?? data.recording?.link ?? data.downloadUrl ?? null;
    const room = body?.fqn ?? data.fqn ?? data.room ?? data.roomName ?? body?.room ?? '';

    if (!link) {
      this.logger.log(`JaaS webhook ${eventType || '(no type)'} — no recording link (room ${room || '?'})`);
      return { received: true };
    }
    const sessionId = this.roomToSessionId(room);
    if (!sessionId) {
      this.logger.warn(`JaaS recording webhook: could not map room "${room}" to a session`);
      return { received: true };
    }
    await this.sessionRepo.update(sessionId, { recordingUrl: link });
    this.logger.log(`Saved recording link for session ${sessionId}`);
    return { received: true, saved: true };
  }

  /** Issues a JaaS JWT for the room — only after the access check passes. */
  async getJaasToken(sessionId: string, user: { id: string; role: string }) {
    const { canModerate } = await this.getAccess(sessionId, user);
    const u = await this.userRepo.findOneBy({ id: user.id });
    const name = u
      ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email
      : user.id;
    const room = this.roomName(sessionId);
    const jwt = this.jaas.sign({
      room,
      user: { id: user.id, name, email: u?.email ?? '' },
      moderator: canModerate,
    });
    return { jwt, appId: this.jaas.applicationId, room, moderator: canModerate };
  }

  /**
   * Classroom access control: only the program's tutor/assistant, an approved
   * enrolled learner, or an admin may enter a session room.
   */
  async getAccess(sessionId: string, user: { id: string; role: string }) {
    const session = await this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .leftJoinAndSelect('program.instructor', 'instructor')
      .leftJoinAndSelect('program.assistants', 'assistants')
      .where('s.id = :id', { id: sessionId })
      .getOne();
    if (!session) throw new NotFoundException('Session not found');

    const programId = session.program?.id;
    const isInstructor = session.program?.instructor?.id === user.id;
    const isAssistant = (session.program?.assistants ?? []).some((a: any) => a.id === user.id);

    let allowed = false;
    let canModerate = false;
    if (user.role === 'admin' || isInstructor || isAssistant) {
      allowed = true;
      canModerate = true;
    } else if (user.role === 'learner' && programId) {
      const count = await this.enrollmentRepo.count({
        where: { learner: { id: user.id }, program: { id: programId }, status: EnrollmentStatus.APPROVED },
      });
      allowed = count > 0;
    }

    if (!allowed) {
      throw new ForbiddenException('You do not have access to this classroom');
    }
    return { session, canModerate };
  }

  /** Idempotently mark the learner present when they actually join the room. */
  async selfAttend(sessionId: string, userId: string) {
    const existing = await this.attendanceRepo.findOne({
      where: { session: { id: sessionId }, learner: { id: userId } },
    });
    if (existing) return existing; // don't override an instructor's prior mark
    return this.attendanceRepo.save(
      this.attendanceRepo.create({
        session: { id: sessionId } as any,
        learner: { id: userId } as any,
        status: AttendanceStatus.PRESENT,
      }),
    );
  }

  create(data: any) {
    return this.sessionRepo.save(this.sessionRepo.create(data));
  }

  findAll() {
    return this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .orderBy('s.scheduledAt', 'ASC')
      .getMany();
  }

  findByProgram(programId: string) {
    return this.sessionRepo.find({
      where: { program: { id: programId } },
      order: { scheduledAt: 'ASC' },
    });
  }

  findByCohort(cohortId: string) {
    return this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .where('cohort.id = :cohortId', { cohortId })
      .orderBy('s.scheduledAt', 'ASC')
      .getMany();
  }

  async findOne(id: string) {
    const session = await this.sessionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .leftJoinAndSelect('s.attendances', 'attendances')
      .where('s.id = :id', { id })
      .getOne();
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async update(id: string, data: Partial<Session>) {
    await this.sessionRepo.update(id, data);
    return this.findOne(id);
  }

  markAttendance(data: Partial<Attendance>) {
    return this.attendanceRepo.save(this.attendanceRepo.create(data));
  }

  getAttendance(sessionId: string) {
    return this.attendanceRepo.find({ where: { session: { id: sessionId } } });
  }

  async getAtRiskLearners(threshold = 70) {
    const records = await this.attendanceRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.learner', 'learner')
      .leftJoinAndSelect('a.session', 'session')
      .leftJoinAndSelect('session.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .getMany();

    const byLearner = new Map<string, { learner: any; program: any; cohort: any; total: number; present: number }>();
    for (const r of records) {
      const key = r.learner?.id;
      if (!key) continue;
      if (!byLearner.has(key)) {
        byLearner.set(key, {
          learner: r.learner,
          program: r.session?.program,
          cohort: r.session?.program?.cohort,
          total: 0,
          present: 0,
        });
      }
      const e = byLearner.get(key)!;
      e.total++;
      if (r.status === 'present' || r.status === 'excused') e.present++;
    }

    return Array.from(byLearner.values())
      .filter((e) => e.total > 0 && (e.present / e.total) * 100 < threshold)
      .map((e) => ({
        learner: e.learner,
        program: e.program,
        cohort: e.cohort,
        attendanceRate: Math.round((e.present / e.total) * 100),
        sessionsAttended: e.present,
        totalSessions: e.total,
      }))
      .sort((a, b) => a.attendanceRate - b.attendanceRate);
  }

  async getAttendanceByLearner(learnerId: string) {
    const records = await this.attendanceRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.session', 'session')
      .leftJoinAndSelect('session.program', 'program')
      .leftJoinAndSelect('program.cohort', 'cohort')
      .where('a.learnerId = :learnerId', { learnerId })
      .orderBy('session.scheduledAt', 'ASC')
      .getMany();

    const total = records.length;
    const present = records.filter((r) => r.status === 'present' || r.status === 'excused').length;
    return {
      records,
      total,
      present,
      rate: total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }
}
