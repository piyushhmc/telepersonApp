import {
    IsEmail,
    IsString,
  } from 'class-validator'; 
  
  export class SupportEmailDto {
    @IsEmail()
    email: string;
    @IsString()
    message: string;
   
  }
  