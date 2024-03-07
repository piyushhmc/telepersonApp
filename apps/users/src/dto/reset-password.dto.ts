import {
    IsEmail,
    IsString,
    IsStrongPassword,
  } from 'class-validator'; 
  
  export class ResetPasswordDto {
    @IsEmail()
    email: string;
    @IsString()
    token: string;
    @IsString()
    @IsStrongPassword()
    password:string;
  }
  