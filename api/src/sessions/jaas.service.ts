import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';

// Signs short-lived RS256 JWTs for 8x8 JaaS (Jitsi as a Service).
@Injectable()
export class JaasService {
  private readonly appId: string;
  private readonly kid: string;
  private readonly privateKey: string;

  constructor(config: ConfigService) {
    this.appId = config.getOrThrow<string>('JAAS_APP_ID');
    this.kid = config.getOrThrow<string>('JAAS_KID');
    this.privateKey = fs.readFileSync(
      config.getOrThrow<string>('JAAS_PRIVATE_KEY_PATH'),
      'utf8',
    );
  }

  get applicationId(): string {
    return this.appId;
  }

  sign(params: {
    room: string;
    user: { id: string; name: string; email: string };
    moderator: boolean;
  }): string {
    return jwt.sign(
      {
        aud: 'jitsi',
        iss: 'chat',
        sub: this.appId,
        room: params.room,
        context: {
          user: {
            id: params.user.id,
            name: params.user.name,
            email: params.user.email,
            moderator: params.moderator ? 'true' : 'false',
          },
          features: {
            // Only moderators (tutor/assistant/admin) may record.
            recording: params.moderator ? 'true' : 'false',
            livestreaming: 'false',
            transcription: 'false',
            'outbound-call': 'false',
          },
        },
      },
      this.privateKey,
      {
        algorithm: 'RS256',
        keyid: this.kid,
        expiresIn: '4h', // long enough for 2–3 hour sessions
        notBefore: '-10s',
      },
    );
  }
}
