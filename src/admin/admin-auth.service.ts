import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminAuthService {
    constructor(
        private readonly adminService: AdminService,
        private readonly jwtService: JwtService,
    ) { }

    async validateAdmin(email: string, pass: string): Promise<any | null> {
        const admin = await this.adminService.findByEmail(email);
        if (admin && admin.isActive && (await bcrypt.compare(pass, admin.password))) {
            return admin;
        }
        return null;
    }

    async login(loginDto: AdminLoginDto) {
        const admin = await this.validateAdmin(loginDto.email, loginDto.password);
        if (!admin) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = {
            sub: admin.id,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions
        };
        return {
            accessToken: this.jwtService.sign(payload),
        };
    }
}
