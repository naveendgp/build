import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminService } from '../admin/admin.service';
import { AdminRole } from '../schemas/admin.schema';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const adminService = app.get(AdminService);

    const email = process.env.ADMIN_EMAIL || 'admin@otter.com';
    const password = process.env.ADMIN_PASSWORD || 'password123';
    const name = 'Super Admin';

    const existingAdmin = await adminService.findByEmail(email);
    if (existingAdmin) {
        console.log(`Admin ${email} already exists.`);
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        await adminService.create({
            email,
            password: hashedPassword,
            name,
            role: AdminRole.SUPER_ADMIN,
            permissions: ['SUPERADMIN'],
            isActive: true,
        });
        console.log(`Admin ${email} created successfully.`);
    }

    await app.close();
}

bootstrap();
