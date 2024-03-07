import {
    IsEmail,
    IsString,
    IsStrongPassword,
  } from 'class-validator'; 
  
  export class ChangeUserPasswordDto {
    @IsString()
    password: string;
  
    @IsString()
    @IsStrongPassword()
    newPassword:string;
  
    @IsString()
    confirmPassword:string;
  }
  