import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { NotificationService } from './notification-service.service';
import { FcmService } from './fcm.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [FirebaseService, NotificationService, FcmService],
  exports: [NotificationService, FirebaseService, FcmService],
})
export class NotificationModule { }
