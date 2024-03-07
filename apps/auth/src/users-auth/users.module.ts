import {  Module } from '@nestjs/common';
import { DatabaseModule, LoggerModule, User } from '@app/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';


@Module({
  imports: [
   
    DatabaseModule, 
    LoggerModule,
    DatabaseModule.forFeature([User]),
    
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
