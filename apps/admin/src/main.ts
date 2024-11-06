import { NestFactory } from '@nestjs/core';
import { AdminModule } from './admin.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { LoggerModule } from 'nestjs-pino';


async function bootstrap() {
  const app = await NestFactory.create(AdminModule);
  app.enableCors();
  const globalPrefix = "api/v1/admin";
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  LoggerModule.forRoot({
    pinoHttp:{
      name:'admin-microservice',
      level:process.env.PINO_LOG_LEVEL ?? 'info',
      formatters:{
        level: label =>{
          return {level:label}
        },
      }
    }
  })
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  const configService = app.get(ConfigService);
  await app.listen(configService.get('ADMIN_PORT'));
}

bootstrap();




