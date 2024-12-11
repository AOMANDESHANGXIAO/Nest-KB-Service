import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { GroupModule } from './group/group.module';
import { DiscussModule } from './discuss/discuss.module';
import { ClassroomModule } from './classroom/classroom.module';
import { FlowModule } from './flow/flow.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { FilesModule } from './files/files.module';
import { CourseworkModule } from './coursework/coursework.module';
import { GptModule } from './gpt/gpt.module';
import { ViewpointModule } from './viewpoint/viewpoint.module';
import { DataAnalysisModule } from './data-analysis/data-analysis.module';

@Module({
  imports: [
    UserModule,
    GroupModule,
    DiscussModule,
    ClassroomModule,
    FlowModule,
    AuthModule,
    UploadModule,
    FilesModule,
    CourseworkModule,
    GptModule,
    ViewpointModule,
    DataAnalysisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
