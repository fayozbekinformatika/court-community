// api/src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
  providers: [ChatGateway] 
})
export class ChatModule {}