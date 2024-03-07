import {
  IsEmail,
  IsString,
} from 'class-validator';

import { UserRole,Status } from '../models/user.interface';


export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  firstName:string;

  @IsString()
  lastName:string;

  @IsString()
  password: string;

  role: UserRole.USER;
  
  status: Status.PENDING;
  

}
