import {
    IsEmail,
  } from 'class-validator'; 

  import { Status } from '../models/user.interface';
  
  export class ForgotUserPasswordDto {
    @IsEmail()
    email: string;
    
  }
  