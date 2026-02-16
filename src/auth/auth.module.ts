import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtHelper } from './jwt.helper';

@Module({
  imports: [
    JwtModule.register({}),
  ],
  providers: [JwtHelper],
  exports: [JwtHelper, JwtModule],
})
export class AuthModule {}

