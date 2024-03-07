import {
  IsString,
} from 'class-validator';

export class PutUserDto {
 
  @IsString()
  firstName:string;

  @IsString()
  lastName:string;

  @IsString()
  mobile:string;

  @IsString()
  extension:string;

  @IsString()
  facebook:string;

  @IsString()
  linkedin:string;

  @IsString()
  twitter:string;
  
  @IsString()
  instagram:string;

  @IsString()
  status:string;

  @IsString()
  role:string;
}
