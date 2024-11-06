import { Global, Module, forwardRef } from '@nestjs/common';

import { MXPlatformController } from './mx-platform.controller';
import { AUTH_SERVICE, DatabaseModule, User } from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { UsersForgotPaswordRepository } from '../users-forgot-password.repository';
import { UsersReferalRepository } from '../users-referal.repository';
import { UserVenndorsRepository } from '../user-vendors/user-vendors.repository';
import { Common } from '../utils/common';
import { MXUserTransctionRepository } from '../mx-user-transction.repository';
import { S3Module } from 'apps/admin/src/s3/s3.module';
import { S3Service } from '../s3/s3.service';
import { ForgotPassword } from '../models/user-forgot-password.entity';
import { UserReferal } from '../models/userreferal.entity';
import { UserVendors } from '../user-vendors/models/user-vendors.entity';
import { MXUserTransction } from '../models/mx-user-transction.entity';
import { Vendors } from '../user-vendors/models/vendors.entity';
import { VendorLocation } from '../user-vendors/models/vendor-location.entity';
import { TwilioLogs } from '../user-vendors/models/twiliologs.entity';


@Global()
@Module({
    imports: [
        S3Module,
        DatabaseModule.forFeature([User,ForgotPassword,UserReferal,UserVendors,MXUserTransction,Vendors,VendorLocation,TwilioLogs]),
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
    ],
    providers: [UsersService, UsersRepository,UsersForgotPaswordRepository,
      UsersReferalRepository,UserVenndorsRepository,Common,MXUserTransctionRepository,S3Service],
    exports: [],
    controllers: [MXPlatformController],
})
export class MXPLATFORMModule { }
