import { Global, Module } from '@nestjs/common';
import * as Joi from 'joi';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import {
  DatabaseModule,
  LoggerModule,
  AUTH_SERVICE,
  HealthModule,
} from '@app/common';
import { UsersRepository } from './users.repository';
import { User } from '@app/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { S3Module } from './s3/s3.module';
import { UserVendorsModule } from './user-vendors/user-vendors.module';
import { UsersForgotPaswordRepository } from './users-forgot-password.repository';
import { ForgotPassword } from './models/user-forgot-password.entity';
import { UsersReferalRepository } from './users-referal.repository';
import { UserReferal } from './models/userreferal.entity';
import { Common } from './utils/common';
import { UserVendors } from './user-vendors/models/user-vendors.entity'; 
import { UserVenndorsRepository } from './user-vendors/user-vendors.repository';
import { MXUserTransctionRepository } from './mx-user-transction.repository';
import { ScheduleModule } from '@nestjs/schedule';
import { MXUserTransction } from './models/mx-user-transction.entity';
import { Vendors } from './user-vendors/models/vendors.entity';
import { VendorLocation } from './user-vendors/models/vendor-location.entity';
import { MXPlatformController } from './mx-platform/mx-platform.controller';
import { TwilioModule } from './twilio/twilio.module';
import { TwilioLogs } from './user-vendors/models/twiliologs.entity';
// import { TwilioService } from './twilio/twilio.service';
@Global()
@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([User,ForgotPassword,UserReferal,UserVendors,MXUserTransction,Vendors,VendorLocation,TwilioLogs]),
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        USER_PORT: Joi.number().required(),
        AUTH_HOST: Joi.string().required(),
        AUTH_PORT: Joi.number().required(),
        MAILGUN_SMTP_USER: Joi.string().required(),
        MAILGUN_SMTP_PASSWORD: Joi.string().required(),
      }),
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
    ScheduleModule.forRoot(),
    HealthModule,
    S3Module,
    UserVendorsModule,
    TwilioModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository,UsersForgotPaswordRepository,
    UsersReferalRepository,UserVenndorsRepository,Common,
    MXUserTransctionRepository,MXPlatformController],
})


export class UsersModule {}

