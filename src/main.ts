import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

function printBanner() {
  const banner = `
╔══════════════════════════════════════════════════════════════
║                                                             ║
║     ██████╗ ████████╗████████╗███████╗██████╗               ║
║    ██╔═══██╗╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗              ║
║    ██║   ██║   ██║      ██║   █████╗  ██████╔╝              ║
║    ██║   ██║   ██║      ██║   ██╔══╝  ██╔══██╗              ║
║    ╚██████╔╝   ██║      ██║   ███████╗██║  ██║              ║
║     ╚═════╝    ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝              ║
║                                                             ║
║                    Backend API Server                       ║
║                    Version 1.0.0                            ║
║                                                             ║
╚══════════════════════════════════════════════════════════════
  `;
  console.log('\x1b[36m%s\x1b[0m', banner); // Cyan color
}

import { json, urlencoded } from 'express';

async function bootstrap() {
  printBanner();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map(error => {
          return Object.values(error.constraints || {}).join(', ');
        });
        return new BadRequestException(messages.join('; '));
      },
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('OTTER Laundry Backend API')
    .setDescription('The OTTER Laundry Backend API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`\n🚀 Server is running on: http://localhost:${port}`);
  console.log(`📚 Swagger API Documentation: http://localhost:${port}/api\n`);
}

// Start the application
bootstrap();
