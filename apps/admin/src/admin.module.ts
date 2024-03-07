import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { VendorsModule } from './vendors/vendors.module';
import { AUTH_SERVICE, DatabaseModule, HealthModule, LoggerModule } from '@app/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Joi from 'joi';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    UsersModule,
    VendorsModule,
    DatabaseModule,
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      // validationSchema: Joi.object({
      //   ADMIN_PORT: Joi.number().required(),
      //   AUTH_HOST: Joi.string().required(),
      //   AUTH_PORT: Joi.number().required(),
      // }),
    }),
    
    ClientsModule.registerAsync([
      {
        name: AUTH_SERVICE,
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('AUTH_HOST'),
            port: configService.get('AUTH_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    
    HealthModule,
    
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
