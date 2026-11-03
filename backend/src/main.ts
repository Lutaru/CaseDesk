import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { runInitialSeed } from './database/seeds/initial-seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global de API
  app.setGlobalPrefix('api');

  // Habilitar CORS para el frontend (Angular)
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true,
  });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('CaseDesk API')
    .setDescription(
      'API de la Plataforma Centralizada de Gestión de Casos Técnicos (Contabilidad, Inventario, etc.)',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese el token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Ejecutar seed inicial de roles, permisos y admin por defecto
  const dataSource = app.get(DataSource);
  await runInitialSeed(dataSource);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 CaseDesk Backend corriendo en: http://localhost:${port}/api`);
  console.log(`📚 Swagger Docs disponible en: http://localhost:${port}/api/docs`);
}
bootstrap();
