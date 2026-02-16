import { Module, Global } from '@nestjs/common';
import { PrismaCacheService } from './prisma-cache.service';

/**
 * Global PostgreSQL Cache Module
 * This module makes PrismaCacheService available globally across the application
 * Uses PostgreSQL-backed cache via Prisma (replaces MongoDB cache)
 */
@Global()
@Module({
  providers: [PrismaCacheService],
  exports: [PrismaCacheService],
})
export class InMemoryStoreModule {}
