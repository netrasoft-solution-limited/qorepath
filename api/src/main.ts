import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // CORS_ORIGINS: comma-separated list of allowed frontend origins (e.g. the Vercel URL).
  const origins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
  app.enableCors({ origin: origins, credentials: true });
  await app.listen(process.env.PORT ?? 3001);
  console.log(`NetraNova API running on http://localhost:${process.env.PORT ?? 3001}/api`);
}
bootstrap();
