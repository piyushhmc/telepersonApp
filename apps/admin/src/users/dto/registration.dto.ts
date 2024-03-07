import {
    IsEmail,
    IsString,
  } from 'class-validator';
  
  import { UserRole,Status } from '../models/user.interface';
  
  
  export class RegisterUserDto {
    @IsEmail()
    email: string;
  
    @IsString()
    firstName:string;
  
    @IsString()
    lastName:string;
    
    @IsString()
    password: string;
  
    @IsString()
    role: string;
    
  
  }
  