import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors();

  // Strips unknown fields and turns class-validator errors into clear
  // 400 responses automatically for every endpoint (Error Handling requirement).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api');

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`OTech Inventory API running on http://localhost:${port}/api`);
}

bootstrap();
