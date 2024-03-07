import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Put,
  Request,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  FileValidator,
  ParseFilePipeBuilder,
  HttpStatus,
  UploadedFiles,
  UnprocessableEntityException
} from '@nestjs/common';


import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangeUserPasswordDto } from './dto/change-password.dto';
import { CurrentUser, JwtAuthGuard, Roles, User } from '@app/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { Express } from 'express';
import { FileInterceptor } from "@nestjs/platform-express"
import { ForgotUserPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Common } from './utils/common';
import { UserReferalDto } from './dto/user-referal.dto';
import { SupportEmailDto } from './dto/support-email.dto';



class MaxFileSize extends FileValidator<{ maxSize: number }>{
  constructor(options: { maxSize: number }) {
    super(options)
  }

  isValid(file: Express.Multer.File): boolean | Promise<boolean> {
    const in_mb = file.size / 1000000
    return in_mb <= this.validationOptions.maxSize
  }
  buildErrorMessage(): string {
    return `File uploaded is too big. Max size is (${this.validationOptions.maxSize} MB)`
  }
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly common: Common
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('test-guard')
  getHello(): string {
    return this.usersService.getHello();
  }


  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
   
    try{
      const newUser = await  this.usersService.create(createUserDto);
      return this.common.makeSuccessResponse(newUser, 201)
    }
    catch(err){
      throw new UnprocessableEntityException(err)
    }
   
  }

  @Post('join-beta')
  async joinAsBeta(@Body() userReferalDto: UserReferalDto) {
   try{
    const betaUser = await this.usersService.joinAsBeta(userReferalDto);
    return this.common.makeSuccessResponse(betaUser, 200)
   }catch(err){
    throw err
   }
  }

  @Roles('User','Admin')
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changeUserPassword(
    @Body() changeUserPasswordDto: ChangeUserPasswordDto,
    @CurrentUser() user: User,
  ) {
    return this.usersService.changeUserPassword(changeUserPasswordDto, user);
  }

  @Roles('User','Admin')
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserDetails(@CurrentUser() user: User) {
    try {
      let userDetails = await this.usersService.getUserDetails(user.id);
      return this.common.makeSuccessResponse(userDetails, 200)
    }
    catch (err) {
      throw new UnprocessableEntityException(err)
    }
  }

  @Roles('User','Admin')
  @UseGuards(JwtAuthGuard)
  @Patch()
  updateUser(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(user.id, updateUserDto);
  }

  @Roles('User','Admin')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @Post('upload-image')
  addUserProfileImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg)$/,
        })
        .addValidator(
          new MaxFileSize({
            maxSize: 1
          }),
        )
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
        })
    ) file: Express.Multer.File,
    @CurrentUser() user: User
  ) {
    return this.usersService.addUserProfileImage(user.id, file);
  }

  @Post('forgotPassword')
  forgotPassword(@Body() forgotPasswordDto: ForgotUserPasswordDto) {
    return this.usersService.forgotPassword(forgotPasswordDto);
  }

  @Post('resetPassword')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(resetPasswordDto);

  }

  @Post('support-email')
  supportEmail(@Body() supportEmailDto:SupportEmailDto){
    return this.usersService.supportEmail(supportEmailDto);
  }

}
