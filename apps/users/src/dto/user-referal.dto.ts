import {
  IsEmail,
  IsString,
} from 'class-validator';



export class UserReferalDto {
  @IsEmail()
  email: string;

  @IsString()
  firstName:string;

  @IsString()
  lastName:string;

}
