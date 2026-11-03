import { Global, Module } from '@nestjs/common';
import { AccessService } from './access.service';

// Global so every controller can inject AccessService without importing this module.
@Global()
@Module({
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
