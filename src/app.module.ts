import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { GroupModule } from './group/group.module';
import { DiscussModule } from './discuss/discuss.module';

@Module({
  imports: [UserModule, GroupModule, DiscussModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
