import { IsEmail,  IsString } from 'class-validator';
import { UserRole,Status } from '../models/user.interface';


export class GetUserDto {
  
  email: string;
  firstName:string;
  lastName:string;
  role: string;
  status: string;
  profileImage: string;

}
