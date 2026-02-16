import { Module } from '@nestjs/common';
import { OfferService } from './offer.service';
import { OfferController } from './offer.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        AuthModule,
    ],
    controllers: [OfferController],
    providers: [OfferService],
    exports: [OfferService],
})
export class OfferModule {}
