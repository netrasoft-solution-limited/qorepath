import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseOptions } from './database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CohortsModule } from './cohorts/cohorts.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { SessionsModule } from './sessions/sessions.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { PaymentsModule } from './payments/payments.module';
import { CertificatesModule } from './certificates/certificates.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { GraduationModule } from './graduation/graduation.module';
import { MaterialsModule } from './materials/materials.module';
import { ProgramsModule } from './programs/programs.module';
import { SettingsModule } from './settings/settings.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { MailModule } from './mail/mail.module';
import { AccessModule } from './access/access.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { InboxModule } from './inbox/inbox.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...databaseOptions(process.env),
        // Nest registers entities per module; migrations run before the app starts serving.
        entities: [],
        autoLoadEntities: true,
        migrationsRun: true,
      }),
    }),
    IntegrationsModule,
    AuditModule,
    MailModule,
    AccessModule,
    AuthModule,
    UsersModule,
    CohortsModule,
    EnrollmentsModule,
    SessionsModule,
    AssignmentsModule,
    PaymentsModule,
    CertificatesModule,
    AnnouncementsModule,
    GraduationModule,
    MaterialsModule,
    ProgramsModule,
    SettingsModule,
    WithdrawalsModule,
    InboxModule,
  ],
})
export class AppModule {}
