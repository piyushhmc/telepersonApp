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
  UnprocessableEntityException,
  BadRequestException,
  Res,
  Req,
  Query
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
import { Logger } from 'nestjs-pino';
import { MxUserDto } from './dto/add-mx-user.dto';
import { MXPlatformController } from './mx-platform/mx-platform.controller';
import { TwilioService } from './twilio/twilio.service';
import { Response } from 'express'; 
import { TwiliologsDto } from './user-vendors/dto/trwiliologs.dto';



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
    private readonly common: Common,
    private readonly logger: Logger,
    private readonly mxcontroller: MXPlatformController,
    private readonly twilioService: TwilioService
  ) { }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {

    try {
      const newUser = await this.usersService.create(createUserDto);
      return this.common.makeSuccessResponse(newUser, 201)
    }
    catch (err) {
      this.logger.log(err)
      throw new UnprocessableEntityException(err)
    }

  }

  @Put('verify-email/:token')
  async verifyUserEmail(
    @Param('token') token: string
  ) {
    try {
      return await this.usersService.verifyUserEmail(token)
    }
    catch (err) {
      this.logger.log(err)
      throw new UnprocessableEntityException(err)
    }

  }

  @Post('join-beta')
  async joinAsBeta(@Body() userReferalDto: UserReferalDto) {
    try {
      const betaUser = await this.usersService.joinAsBeta(userReferalDto);
      return this.common.makeSuccessResponse(betaUser, 200)
    } catch (err) {
      this.logger.log(err)
      throw err
    }
  }

  @Roles('User', 'Admin')
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changeUserPassword(
    @Body() changeUserPasswordDto: ChangeUserPasswordDto,
    @CurrentUser() user: User,
  ) {
    return this.usersService.changeUserPassword(changeUserPasswordDto, user);
  }

  @Roles('User', 'Admin')
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserDetails(@CurrentUser() user: User) {
    try {
      let userDetails = await this.usersService.getUserDetails(user.id);
      return this.common.makeSuccessResponse(userDetails, 200)
    }
    catch (err) {
      this.logger.log(err)
      throw new UnprocessableEntityException(err)
    }
  }

  @Roles('User', 'Admin')
  @UseGuards(JwtAuthGuard)
  @Patch()
  updateUser(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(user.id, updateUserDto);
  }

  @Roles('User', 'Admin')
  @UseGuards(JwtAuthGuard)
  @Post('add-mx-user-details')
  addMxDetailsToUser(@CurrentUser() user: User, @Body() mxUserDto: MxUserDto) {
    return this.usersService.addMxDetailsToUser(user.id, mxUserDto);
  }

  @Roles('User', 'Admin')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @Post('upload-image')
  addUserProfileImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|PNG)$/,
        })
        // .addValidator(
        //   new MaxFileSize({
        //     maxSize: 10000
        //   }),
        // )
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
  supportEmail(@Body() supportEmailDto: SupportEmailDto) {
    return this.usersService.supportEmail(supportEmailDto);
  }

  // created for testing cron data 
  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('test-mx-transction')
  async testMx() {
    try {
      return await this.usersService.handleCron()
    }
    catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  @Post('mx-hooks')
  async mxHooks(@Req() req) {
    try {
      const user = await this.usersService.getUserIdByUsrGuid(req?.body?.user_guid)
      let name = user[0]?.firstName+" "+user[0]?.lastName
      let result = await this.mxcontroller.listTransactionsByMember(user[0]?.id,name, user[0]?.email,req?.body?.user_guid, req?.body?.member_guid, 1)
      return result
    }
    catch (err) {
      throw new BadRequestException(err.message)
    }
  }

  @Post('/token')
  async generateToken() {
    try {
      const token = this.twilioService.generateToken('user');

      const response = {
        token,
        identity: 'user',
        twilioNumber: this.twilioService.getTwilioNumber()
      }

      return response
    }
    catch (err) {
      this.logger.log(err.message)
      throw new UnprocessableEntityException(err.message)
    }
  }

  @Post('/twiliocallinglogs')
  async twilioCallinglogs(@Body() twilioDto: TwiliologsDto) {
    try {
      return await this.usersService.twiliologs(twilioDto);
    }
    catch (err) {
      this.logger.log(err.message)
      throw new UnprocessableEntityException(err.message)
    }
  }

  @Post('/voice')
  handleVoice(@Body() body: any, @Res() res: Response): void {
    try {
      const { To } = body;
      const twiml = this.twilioService.generateTwiml(To);
      res.type('text/xml');
      res.send(twiml);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error generating TwiML');
    }
  }

  @Roles('User', 'Admin')
  @UseGuards(JwtAuthGuard)
  @Get('userTransction')
  async getUserTransction(@CurrentUser() user: User,@Query('limit') limit: string,){
    try{
      const userMxTransctionData = await this.usersService.getUserMxTransctionData(user.id,+limit);
      return this.common.makeSuccessResponse(userMxTransctionData, 200)
    }
    catch(err){
      this.logger.log(err.message)
      throw new UnprocessableEntityException(err.message)
    }

  }

}
