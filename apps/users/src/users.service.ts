import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from '@app/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangeUserPasswordDto } from './dto/change-password.dto';
import { UsersRepository } from './users.repository';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { User as CurrentUser } from '@app/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { Express } from 'express';
import { FileInterceptor } from "@nestjs/platform-express"
import { S3Service } from './s3/s3.service';
import { ForgotUserPasswordDto } from './dto/forgot-password.dto';
import { UsersForgotPaswordRepository } from './users-forgot-password.repository';
import { ForgotPassword } from './models/user-forgot-password.entity';
import { LessThanOrEqual, Repository } from "typeorm"
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersReferalRepository } from './users-referal.repository';
import { number } from 'joi';
import { UserVendors } from './user-vendors/models/user-vendors.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserVenndorsRepository } from './user-vendors/user-vendors.repository';
import { UserReferalDto } from './dto/user-referal.dto';
import { UserReferal } from './models/userreferal.entity';
import { Status ,UserRole} from  './models/user.interface'
import { SupportEmailDto } from './dto/support-email.dto';


@Injectable()
export class UsersService {

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
    private readonly forgotPasswordRepository: UsersForgotPaswordRepository,
    private readonly userReferalRepo: UsersReferalRepository,
    private readonly userVenndorsRepository: UserVenndorsRepository
  ) { }

  getHello(): string {
    return 'Hello World!';
  }

  async create(createUserDto: CreateUserDto) {

    const user = new User({})
    user.firstName = createUserDto.firstName
    user.lastName = createUserDto.lastName
    user.email = createUserDto.email
    user.status = Status.ACTIVE
    user.role = createUserDto.role
    user.password = await bcrypt.hash(createUserDto.password, +this.configService.get('SALT'))
    try {
     
        await this.validateCreateUserDto(createUserDto);
        let createdUser = await this.usersRepository.create(user);

        let html = `<html> <head> Dear ${createUserDto.firstName}, </head> <body> <p> Thank you for registering with TelePerson App !  </p> 
        <p> your account is in review. </p></body></html>`
        let subject = `Welcome to our platform`

        this.sendEmail(createUserDto.email, subject, html)

        this.createUserVendorMap(createdUser.id)

        return createdUser

     
    } catch (err) {
      throw new UnprocessableEntityException(`error in creating user  ${err}`);
    }
  }

  async changeUserPassword(
    changeUserPasswordDto: ChangeUserPasswordDto,
    { email }: CurrentUser,
  ) {

    const password = changeUserPasswordDto.password
    const newPassword = changeUserPasswordDto.newPassword
    const confirmPassword = changeUserPasswordDto.confirmPassword

    // checking  new password and confirm password is same or not
    if (newPassword != confirmPassword) {
      throw new UnprocessableEntityException('newPassword and confirmPassword is not matching');
    }

    // checking  new password and confirm password is different or not
    if (newPassword == password) {
      throw new UnprocessableEntityException('newPassword and password is same');
    }

    // verifying User

    try {
      let user = await this.verifyUser(email, password)
      // creating password hash
      user.password = await bcrypt.hash(newPassword, 10)

      return await this.usersRepository.findOneAndUpdate({ email: email }, user);
    } catch (err) {
      throw new UnprocessableEntityException(err);
    }

  }

  async getUserDetails(id: number) {

    try {

      return this.usersRepository.findOne({ id })

    }
    catch (err) {
      throw new UnprocessableEntityException(err);
    }

  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {

    try {

      const user = await this.usersRepository.findOneAndUpdate(
        { id },
        updateUserDto,
      );
      
      return updateUserDto
    }
    catch (err) {
      throw new UnprocessableEntityException(err);
    }
  }

  private async validateCreateUserDto(createUserDto: CreateUserDto) {
    try {
      await this.usersRepository.findOne({ email: createUserDto.email });
    } catch (err) {
      return;
    }
    throw new UnprocessableEntityException('Email already exists');
  }

  async verifyUser(email: string, password: string) {

    try {

      const user = await this.usersRepository.findOne({ email });
      const passwordIsValid = await bcrypt.compare(password, user.password);
      if (!passwordIsValid) {
        throw new UnauthorizedException('Credentials are not valid.');
      }
      return user;

    } catch (err) {
      throw new UnauthorizedException(err);
    }

  }

  async sendEmail(email: string, subject: string, text: string) {
    const transporter = nodemailer.createTransport({
      service: 'brevo',
      host: 'smtp-relay.brevo.com',
      port: 587,
      auth: {
        user: this.configService.get('MAILGUN_SMTP_USER'),
        pass: this.configService.get('MAILGUN_SMTP_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: this.configService.get('MAILGUN_SENDER_EMAIL'),
      to: email,
      subject: subject,
      text: text,
    };

    await transporter.sendMail(mailOptions);
  }

  async addUserProfileImage(id: number, file: Express.Multer.File) {

    const key = `${id}/${file.fieldname}${Date.now()}`
    const imageUrl = await this.s3Service.uploadFile(file, key)
    const updatedUser = await this.usersRepository.findOneAndUpdate(
      { id },
      { profileImage: imageUrl },
    );

    return updatedUser
  }

  async forgotPassword(forgotPassword: ForgotUserPasswordDto) {
    try {

      const validUser = await this.checkUserEmailExsts(forgotPassword.email)

      if (validUser) {
        const forgetPasswordUrl =  `${this.configService.get('FE_URL')}/reset-password`
        const token = Math.random().toString(36).slice(-8);
        const expiryDate = new Date();
        const forgotPwd = new ForgotPassword({})
        expiryDate.setHours(expiryDate.getHours() + 1);
        forgotPwd.email = forgotPassword.email
        forgotPwd.token = token
        forgotPwd.expiryDate = expiryDate
        await this.forgotPasswordRepository.create(forgotPwd);
        let subject = `Reset Password`
        let html = `<html> <head> Password Reset! </head> <body> <p> reset your password using token. token will expire in 1 hr. </p>
        <p> <a href="${forgetPasswordUrl}?token=${token}&email=${forgotPassword.email}">Click here To Reset Your Password!</a></p></body></html>`
        await this.sendEmail(forgotPassword.email, subject, html)
      } else {
        throw new UnprocessableEntityException(`User Not Found!`);
      }

      let response = {
        "status": 201,
        "message": "Forgot password link send to you mail. Check your mail!"
      }

      return response
    } catch (err) {
      throw new UnprocessableEntityException(`${err.message}`);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {

    try {
      const isValid = await this.checkUserPasswordReseted(resetPasswordDto.email, resetPasswordDto.token)

      if (isValid != null) {
        const user = new User({})
        // creating password hash
        user.password = await bcrypt.hash(resetPasswordDto.password, +this.configService.get('SALT'))
        return await this.usersRepository.findOneAndUpdate({ email: resetPasswordDto.email }, user);
      } else {
        throw new UnauthorizedException('Invalid User!');
      }
    }
    catch (err) {
      throw new UnprocessableEntityException(err);
    }
  }

  private async checkUserEmailExsts(email: string) {
    try {
      const user = await this.usersRepository.findOne({ email: email });
      if (!user) {
        return false
      }
      return true;
    }
    catch (err) {
      return false
    }
  }

  private async checkUserPasswordReseted(email: string, token: string) {
    try {
      const selectField = [`forgot_password.id`]
      return await this.forgotPasswordRepository.resetPasswordValidateQuery('forgot_password', selectField, email, token);

    } catch (err) {
      throw new UnauthorizedException('Invalid User!');
    }

  }

  private async validateUserWithReferalCode(email: string, referalCode: string) {

    try {

      return await this.userReferalRepo.findReferal(email, referalCode)

    }
    catch (err) {
      throw new UnauthorizedException('Referal Code Or Email are not valid!');
    }

  }

  private async createUserVendorMap(uiderId: number) {

    const vendorIds = [135, 56, 458]
    try {
      for (let i = 0; i < vendorIds.length; i++) {
        const userVendor = new UserVendors({})
        userVendor.userId = uiderId;
        userVendor.vendorId = vendorIds[i];
        userVendor.isPlaidLinked = 1;
        userVendor.isActive = true;
        userVendor.assignedDate = new Date();
        await this.userVenndorsRepository.create(userVendor)
      }
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new UnprocessableEntityException('Duplicate user-vendor entry');
      } else {
        throw new UnprocessableEntityException(err);
      }
    }
  }

  async joinAsBeta(userReferalDto: UserReferalDto) {

    const userReferal = new UserReferal({})
    userReferal.firstName = userReferalDto.firstName
    userReferal.lastName = userReferalDto.lastName
    userReferal.referalCode = Math.random().toString(36).slice(-8);
    userReferal.email = userReferalDto.email
    

    try {
      const emailExists = await this.checkReferalUserEmailExsts(userReferalDto.email)
      if (!emailExists) {
        throw new UnprocessableEntityException(`You have already requested for Beta User`);
      } else {
        const betaUsr = await this.userReferalRepo.create(userReferal);

        let html = `<html> <head> Dear ${userReferal.firstName}, </head> <body> <p> Thank you for registering as Beta user with TelePerson App !  </p> 
       </body></html>`;
        let subject = `Welcome to our platform`;
        this.sendEmail(userReferal.email, subject, html);
        return betaUsr;

      }
    }
    catch (err) {
      throw new UnprocessableEntityException(`${err.message}`);
    }

  }

  private async checkReferalUserEmailExsts(email: string) {
    try {
      const user = await this.userReferalRepo.findOne({ email: email });
      if (user) {
        return false;
      }
      return true;
    }
    catch (err) {
      return true;
    }
  }

  async supportEmail(supportEmailDto:SupportEmailDto){
    
        let html = `<html> <body> <p> Sender Email :: ${supportEmailDto.email} </p> <p> Message ::  ${supportEmailDto.message} </p> 
       </body></html>`;
        let subject = `Support Email !`;
        await this.sendEmail(this.configService.get('SUPPORT_RECEIVER_EMAIL'), subject, html);

        return true
  }

}

