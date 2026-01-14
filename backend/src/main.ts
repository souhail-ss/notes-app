import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend (allow all for local network testing)
  app.enableCors({
    origin: true, // Allow any origin
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log('🚀 Backend running on http://localhost:3000');
  console.log('🌐 Network access: http://192.168.1.165:3000');
}
bootstrap();
