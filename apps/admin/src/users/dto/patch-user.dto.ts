import {
  IsJSON,
  IsString,
} from 'class-validator';

import { UserRole,Status } from '../models/user.interface';


export class PatchUserDto {
  @IsString()
  status: string;
}
