import { Body, Controller, Get, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { CurrentUser, User } from '@app/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';



@Controller("users")
@UsePipes( new ValidationPipe({
  whitelist:true,
  transform: true,
}))

export class UsersController {
  constructor(
      private readonly usersService: UsersService
    ){}
}
