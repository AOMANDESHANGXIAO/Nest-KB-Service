import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { GroupModule } from './group/group.module';
import { DiscussModule } from './discuss/discuss.module';
import { ClassroomModule } from './classroom/classroom.module';
import { FlowModule } from './flow/flow.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    UserModule,
    GroupModule,
    DiscussModule,
    ClassroomModule,
    FlowModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
