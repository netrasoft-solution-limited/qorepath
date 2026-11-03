import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        // DATABASE_URL (e.g. from Neon) takes precedence over the individual DB_* settings.
        url: config.get('DATABASE_URL'),
        ssl: config.get('DB_SSL') === 'true' || !!config.get('DATABASE_URL'),
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    IntegrationsModule,
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
