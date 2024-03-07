import {
  IsAlphanumeric,
  IsArray,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';


export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  firstName:string;

  @IsString()
  lastName:string;

  password: string;

  @IsOptional()
  role:string;
}
