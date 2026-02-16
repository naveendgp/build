import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DeliveryModule,
  ],
  providers: [CronService],
  exports: [CronService],
})
export class CronModule {}
