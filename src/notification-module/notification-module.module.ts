import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { NotificationService } from './notification-service.service';

@Module({
  imports: [],
  controllers: [],
  providers: [FirebaseService, NotificationService],
  exports: [NotificationService, FirebaseService],
})
export class NotificationModule {}
