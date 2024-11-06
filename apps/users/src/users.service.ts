import {
  Injectable,
  NotFoundException,
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
import { Status, UserRole } from './models/user.interface'
import { SupportEmailDto } from './dto/support-email.dto';
import { Logger } from 'nestjs-pino';
import { MxUserDto } from './dto/add-mx-user.dto';
import { Cron, CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import axios from 'axios';
import { format, subDays } from 'date-fns';
import { CronJob } from "cron";
import { MXUserTransctionRepository } from './mx-user-transction.repository';
import { MXUserTransction } from './models/mx-user-transction.entity';
import { Vendors } from './user-vendors/models/vendors.entity';
import { VendorLocation } from './user-vendors/models/vendor-location.entity';
import { v4 as uuidv4 } from 'uuid';
import { NotFound } from '@aws-sdk/client-s3';
import { TwiliologsDto } from './user-vendors/dto/trwiliologs.dto';
import { TwilioLogs } from './user-vendors/models/twiliologs.entity';




@Injectable()
export class UsersService {

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
    private readonly forgotPasswordRepository: UsersForgotPaswordRepository,
    private readonly userReferalRepo: UsersReferalRepository,
    private readonly userVenndorsRepository: UserVenndorsRepository,
    @InjectRepository(TwilioLogs)
    private readonly twilioRepository: Repository<TwilioLogs>,
    private readonly logger: Logger,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly mxUserTransctionRepo: MXUserTransctionRepository,
    @InjectRepository(Vendors)
    private readonly vendorRepository: Repository<Vendors>,
    @InjectRepository(VendorLocation)
    private readonly vendorLocationRepo: Repository<VendorLocation>
  ) { }

  async onModuleInit() {
    this.scheduleMxTransctionCronJob();
  }

  private scheduleMxTransctionCronJob() {
    const jobName = "mxTransctionJob";
    if (this.schedulerRegistry.doesExist("cron", jobName)) {
      // Remove the existing job if it exists
      this.schedulerRegistry.deleteCronJob(jobName);
      console.log(`Existing cron job '${jobName}' removed.`);
    }

    const job = new CronJob(
      CronExpression.EVERY_DAY_AT_1AM,
      async () => {
        await this.handleCron();
      },
      null,
      true,
      "America/New_York"
    );

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();
    console.log("Cron job scheduled:", jobName);

  }

  async handleCron() {
    const startTime = new Date();
    const yesterdayDate = subDays(new Date(), 1);
    let formDate = format(yesterdayDate, 'yyyy-MM-dd');

    const currentDate = new Date();
    let toDate = format(currentDate, 'yyyy-MM-dd');
    let batchSize = this.configService.get<number>("BATCH_SIZE") || 100;
    let numberOfT = 0;
    let userTransactionData = [];
    try {
      let users = await this.getMxUserData(batchSize);
      if (users.length > 0) {
        for (const user of users) {
          try {
            let page = 1
            let totalPage = 0;
            do {
              const userMxTransctions = await this.getMXUserTransctionData(user?.usrGuid, page);
              if (userMxTransctions?.pagination?.total_entries > 0) {
                totalPage = userMxTransctions.pagination.total_pages;
                numberOfT = userMxTransctions.pagination.total_entries
                let transactions = userMxTransctions?.transactions
                page++
                let i = 0
                for (const transction of transactions) {
                  await this.insertMXUserTransctionData(user?.id, transction)
                  i++
                }
              }
            }
            while (page <= totalPage)
            userTransactionData.push({ "name": `${user.firstName} ${user.lastName}`, "totalTransaction": numberOfT })

            console.log("userTransactionData==", userTransactionData)
          } catch (err) {
            console.log("error occured in ===============", err.message)
          }

        }
      }
      // console.log("cron execution ending", new Date());
      const endTime = new Date();

      console.log("cron execution start time: ", startTime);
      console.log("cron execution end   time: ", endTime);
      let env = this.configService.get<string>("ENV")
      if (env != "dev") {
        await this.sendSuccessCronEmail(formDate, toDate, userTransactionData)
      }
      
    } catch (error) {

      let env = this.configService.get<string>("ENV")
      if (env != "dev") {
        await this.sendFailCronEmail(formDate, toDate)
      }

      console.log("error in handle cron", error.message);
    }
  }

  private async getMxUserData(batchSize: number) {
    try {
      return await this.usersRepository.find({ isMX: true })
    }
    catch (err) {
      console.log(err.message)
    }
  }

  private async getMXUserTransctionData(guid: string, page: number) {
    const yesterdayDate = subDays(new Date(), 1);
    let formDate = format(yesterdayDate, 'yyyy-MM-dd');

    const currentDate = new Date();
    let toDate = format(currentDate, 'yyyy-MM-dd');

    // formDate = "2024-06-25"
    // toDate = "2024-06-28"

    const apiUrl = `${this.configService.get('MX_API')}/users/${guid}/transactions?from_date=${formDate}&page=${page}&records_per_page=100&to_date=${toDate}`;
    try {
      const response = await axios.get(`${apiUrl}`, {
        headers: {
          Accept: 'application/vnd.mx.api.v1+json',
          Authorization: this.mxAuthHeader(),
        },
      });

      return response?.data;
    } catch (error) {
      // Handle errors
      this.logger.log(`Error fetching data: ${error.message}`)
      // throw new Error(`Error fetching data: ${error.message}`);
    }

  }

  private mxAuthHeader(): string {
    const username = this.configService.get('MX_USER_NAME');
    const password = this.configService.get('MX_PASSWORD');
    const base64Credentials = Buffer.from(`${username}:${password}`).toString('base64');
    return `Basic ${base64Credentials}`;
  }

  async insertMXUserTransctionData(userId: number, transctionData: any) {
    try {

      const mxUsrT = new MXUserTransction({})
      mxUsrT.accountGuid = transctionData?.account_guid
      mxUsrT.accountId = transctionData?.account_id
      mxUsrT.amount = transctionData?.amount
      mxUsrT.category = transctionData?.category
      mxUsrT.categoryGuid = transctionData?.category_guid
      mxUsrT.date = transctionData?.date
      mxUsrT.description = transctionData?.description
      mxUsrT.extendedTransactionType = transctionData?.extended_transaction_type
      mxUsrT.isBillPay = transctionData?.is_bill_pay
      mxUsrT.isDirectDeposit = transctionData?.is_direct_deposit
      mxUsrT.isExpense = transctionData?.is_expense
      mxUsrT.isFee = transctionData?.is_fee
      mxUsrT.isIncome = transctionData?.is_income
      mxUsrT.isManual = transctionData?.is_manual
      mxUsrT.isOverdraftFee = transctionData?.is_overdraft_fee
      mxUsrT.isPayrollAdvance = transctionData?.is_payroll_advance
      mxUsrT.isProcessed = false
      mxUsrT.isRecurring = transctionData?.is_recurring
      mxUsrT.isSubscription = transctionData?.is_subscription
      mxUsrT.latitude = transctionData?.latitude
      mxUsrT.localizedDescription = transctionData?.localized_description
      mxUsrT.localizedMemo = transctionData?.localized_memo
      mxUsrT.longitude = transctionData?.longitude
      mxUsrT.memberGuid = transctionData?.member_guid
      mxUsrT.merchantLocationGuid = transctionData?.merchant_location_guid
      mxUsrT.metadata = transctionData?.metadata
      mxUsrT.originalDescription = transctionData?.original_description
      mxUsrT.status = transctionData?.status
      mxUsrT.topLevelCategory = transctionData?.top_level_category
      mxUsrT.transactedAt = transctionData?.transacted_at
      mxUsrT.transctionGuid = transctionData?.guid
      mxUsrT.type = transctionData?.type
      mxUsrT.userGuid = transctionData?.user_guid
      mxUsrT.merchantGuid = transctionData?.merchant_guid
      mxUsrT.userId = userId
      mxUsrT.isProcessed = true
      let mxuser = await this.mxUserTransctionRepo.create(mxUsrT);
      if (transctionData?.merchant_guid != "" || transctionData?.merchant_guid != null) {
        await this.createOrUpdateUserVendor(transctionData?.merchant_guid, transctionData?.merchant_location_guid, mxuser.userId)
      }

      return true
      //merchnatguid -->> vendroID 
    }
    catch (err) {
      console.log("err in creating mx transction data ::", err.message)
    }
  }

  async insertMXUserTransctionDatabyMX(userId: number, transctionData: any, count: number, length: number) {
    try {

      const mxUsrT = new MXUserTransction({})
      mxUsrT.accountGuid = transctionData?.account_guid
      mxUsrT.accountId = transctionData?.account_id
      mxUsrT.amount = transctionData?.amount
      mxUsrT.category = transctionData?.category
      mxUsrT.categoryGuid = transctionData?.category_guid
      mxUsrT.date = transctionData?.date
      mxUsrT.description = transctionData?.description
      mxUsrT.extendedTransactionType = transctionData?.extended_transaction_type
      mxUsrT.isBillPay = transctionData?.is_bill_pay
      mxUsrT.isDirectDeposit = transctionData?.is_direct_deposit
      mxUsrT.isExpense = transctionData?.is_expense
      mxUsrT.isFee = transctionData?.is_fee
      mxUsrT.isIncome = transctionData?.is_income
      mxUsrT.isManual = transctionData?.is_manual
      mxUsrT.isOverdraftFee = transctionData?.is_overdraft_fee
      mxUsrT.isPayrollAdvance = transctionData?.is_payroll_advance
      mxUsrT.isProcessed = false
      mxUsrT.isRecurring = transctionData?.is_recurring
      mxUsrT.isSubscription = transctionData?.is_subscription
      mxUsrT.latitude = transctionData?.latitude
      mxUsrT.localizedDescription = transctionData?.localized_description
      mxUsrT.localizedMemo = transctionData?.localized_memo
      mxUsrT.longitude = transctionData?.longitude
      mxUsrT.memberGuid = transctionData?.member_guid
      mxUsrT.merchantLocationGuid = transctionData?.merchant_location_guid
      mxUsrT.metadata = transctionData?.metadata
      mxUsrT.originalDescription = transctionData?.original_description
      mxUsrT.status = transctionData?.status
      mxUsrT.topLevelCategory = transctionData?.top_level_category
      mxUsrT.transactedAt = transctionData?.transacted_at
      mxUsrT.transctionGuid = transctionData?.guid
      mxUsrT.type = transctionData?.type
      mxUsrT.userGuid = transctionData?.user_guid
      mxUsrT.merchantGuid = transctionData?.merchant_guid
      mxUsrT.userId = userId
      let vendorProcessLength = (length > 50) ? 50 : length
      if (count <= vendorProcessLength) {
        mxUsrT.isProcessed = true
      } else {
        mxUsrT.isProcessed = false
      }
      let mxuser = await this.mxUserTransctionRepo.create(mxUsrT);

      if (count <= vendorProcessLength) {
        if (transctionData?.merchant_guid != "" || transctionData?.merchant_guid != null) {
          await this.createOrUpdateUserVendor(transctionData?.merchant_guid, transctionData?.merchant_location_guid, mxuser.userId)
        }
      }

      return true
      //merchnatguid -->> vendroID 
    }
    catch (err) {
      console.log("err in creating mx transction data ::", err.message)
    }
  }

  async createOrUpdateUserVendor(merchnatGuid: string, merchnatLocationGuid: string, userId: number) {
    try {
      let vendor = await this.vendorRepository.findOneBy({ guid: merchnatGuid })
      if (vendor) {
        const existingUserVendorMap = await this.userVenndorsRepository.checkExistingMao(userId, vendor.id)
        //create relationship in vendor table
        if (existingUserVendorMap == 0) {
          let userVendor = new UserVendors({})
          userVendor.vendorId = vendor.id
          userVendor.assignedDate = new Date()
          userVendor.isActive = false
          userVendor.userId = userId // need to map this field
          await this.userVenndorsRepository.create(userVendor)
        }
        if (merchnatLocationGuid) {
          await this.createVendorLocation(merchnatLocationGuid, vendor.id)
        }
      } else {
        // get MX vendor Details
        const mxVendorData = await this.getMxVendorDetails(merchnatGuid)
        //create vendor
        if (mxVendorData?.merchant) {
          let vendor = new Vendors({})
          vendor.isMX = true;
          vendor.isCommunityVendor = 0;
          vendor.isdefaultVendor = 0;
          vendor.guid = merchnatGuid;
          vendor.companyName = mxVendorData.merchant.name;
          vendor.logoUrl = mxVendorData.merchant.logo_url;
          vendor.websiteURL = mxVendorData.merchant.website_url;
          vendor.approvalStatus = "PENDING";
          let name = mxVendorData.merchant.name.substring(0, 3);
          let date = (new Date()).getTime().toString(36)
          vendor.companyCode = `${name}_${date}`;
          vendor = await this.vendorRepository.save(vendor)
          // create relationship in user-vendor table
          let userVendor = new UserVendors({})
          userVendor.vendorId = vendor.id
          userVendor.isActive = false
          userVendor.userId = userId
          userVendor.assignedDate = new Date()
          await this.userVenndorsRepository.create(userVendor)
          if (merchnatLocationGuid) {
            await this.createVendorLocation(merchnatLocationGuid, vendor.id)
          }
        }
      }


    }
    catch (err) {
      console.log("error in createOrUpdateUserVendor", err.message)
    }
  }

  private async getMxVendorDetails(guid: string) {
    const apiUrl = `${this.configService.get('MX_API')}/merchants/${guid}`;
    try {
      const response = await axios.get(`${apiUrl}`, {
        headers: {
          Accept: 'application/vnd.mx.api.v1+json',
          Authorization: this.mxAuthHeader(),
        },
      });

      return response.data;
    } catch (error) {
      // Handle errors
      this.logger.log(`Error fetching data getMxVendorDetails: ${error.message}`)
      // throw new Error(`Error fetching data: ${error.message}`);
    }
  }

  async twiliologs(twilioLogs: TwiliologsDto) {

    try {
      return await this.twilioRepository.save(twilioLogs)
    } catch (error) {
      this.logger.log(`Error ${error.message}`)
    }
  }


  private async createVendorLocation(guid: string, vendorId: number) {
    try {
      const existingLoc = await this.vendorLocationRepo.findOneBy({ guid })
      if (existingLoc == null) {
        const mxVendorLocation = await this.getMxVendorLocation(guid)
        if (mxVendorLocation.merchant_location) {
          let vendorLocation = new VendorLocation({})
          const loc = mxVendorLocation?.merchant_location
          vendorLocation.city = loc?.city
          vendorLocation.country = loc?.country
          vendorLocation.guid = loc?.guid
          vendorLocation.latitude = loc?.latitude
          vendorLocation.longitude = loc?.longitude
          vendorLocation.vendorId = vendorId
          vendorLocation.merchantGuid = loc?.merchant_guid
          vendorLocation.postalCode = loc?.postal_code
          vendorLocation.state = loc?.state
          vendorLocation.streetAddress = loc?.street_address
          await this.vendorLocationRepo.save(vendorLocation)
        }
      }
    }
    catch (err) {
      console.log("error in vendor location", err.message)
    }
  }

  private async getMxVendorLocation(guid: string) {
    const apiUrl = `${this.configService.get('MX_API')}/merchant_locations/${guid}`;
    try {
      const response = await axios.get(`${apiUrl}`, {
        headers: {
          Accept: 'application/vnd.mx.api.v1+json',
          Authorization: this.mxAuthHeader(),
        },
      });

      return response.data;
    } catch (error) {
      // Handle errors
      this.logger.log(`Error fetching data getMxVendorLocation: ${error.message}`)
      // throw new Error(`Error fetching data: ${error.message}`);
    }
  }

  private async sendSuccessCronEmail(formDate: string, toDate: string, userTransactionCounts: any) {
    try {
      let emailContent = `
    <h1>Transaction Summary</h1>
    <p>From: ${formDate} To: ${toDate}</p>
    <table border="1" style="border-collapse: collapse;">
      <tr>
        <th>User</th>
        <th>Number of Transactions</th>
      </tr>`;

      userTransactionCounts.forEach(data => {
        emailContent += `
      <tr>
        <td>${data.name}</td>
        <td>${data.totalTransaction}</td>
      </tr>`;
      });

      emailContent += `</table>`;

      // Send the email (assuming sendEmail is a method to send emails)
      await this.sendEmail('piyush.p@hmcthree.com', 'CRON Transaction Summary', emailContent, ["mangesh.s@hmcthree.com"]);
    }
    catch (err) {
      console.log("error in sending email::", err.message)
    }

  }

  private async sendFailCronEmail(formDate: string, toDate: string) {
    try {
      let html = `<html> <head> Cron run, </head> <body> <p> cron fail from ${formDate}-${toDate}</p>
        </body></html>`
      let subject = `Cron failed from ${formDate}-${toDate}`

      this.sendEmail("piyush.p@hmcthree.com", subject, html)
    }
    catch (err) {
      console.log("error in sending email::", err.message)
    }
  }

  async create(createUserDto: CreateUserDto) {

    const user = new User({})
    user.firstName = createUserDto.firstName
    user.lastName = createUserDto.lastName
    user.email = createUserDto.email
    user.status = Status.PENDING
    user.role = createUserDto.role
    user.password = await bcrypt.hash(createUserDto.password, +this.configService.get('SALT'))
    user.tempToken = uuidv4()
    try {

      const isUserExists = await this.validateCreateUserDto(createUserDto);
      let createdUser: any
      if (isUserExists && isUserExists?.status == "Deleted") {
        createdUser = await this.restoreUser(user, isUserExists.id)
      } else {
        createdUser = await this.usersRepository.create(user);
      }

      let html = `<html> <head> Hey ${createUserDto.firstName}, </head> <body> <p> Welcome to Teleperson. We're thrilled you're here!</p>
      <p>You joined us in our early days as we learn how best to shape the product and make customer service for every brand you shop with awesome!</p>
       <p>Click <a href="${this.configService.get(`FE_URL`)}/login?token=${createdUser.tempToken}"> here </a> to get started! </p>
        <p>If you have any question at all, please don't hesitate to reach me at (727) 999-0544 or jesse@teleperson.com anytime!</p>
        <p>Thank you  for you!<p/><p>Jesse <br/>CEO,Co-founder<br/>Teleperson</p>
        </body></html>`
      let subject = `Welcome to Teleperson: customer service, designed around you!`

      await this.sendEmail(createUserDto.email, subject, html)

      await this.createUserVendorMap(createdUser.id)

      return createdUser


    } catch (err) {
      this.logger.log(`error in creating user ${err}`)
      throw new UnprocessableEntityException(`error in creating user  ${err}`);
    }
  }

  async changeUserPassword(
    changeUserPasswordDto: ChangeUserPasswordDto,
    { email }: CurrentUser,
  ) {

    const password = changeUserPasswordDto.password
    const newPassword = changeUserPasswordDto.newPassword
    const confirmPassword = changeUserPasswordDto.confirmPassword

    // checking  new password and confirm password is same or not
    if (newPassword != confirmPassword) {
      this.logger.log('newPassword and confirmPassword is not matching')
      throw new UnprocessableEntityException('newPassword and confirmPassword is not matching');
    }

    // checking  new password and confirm password is different or not
    if (newPassword == password) {
      this.logger.log('newPassword and password is same')
      throw new UnprocessableEntityException('newPassword and password is same');
    }

    // verifying User

    try {
      let user = await this.verifyUser(email, password)
      // creating password hash
      user.password = await bcrypt.hash(newPassword, 10)

      return await this.usersRepository.findOneAndUpdate({ email: email }, user);
    } catch (err) {
      this.logger.log(err)
      throw new UnprocessableEntityException(err);
    }

  }

  async getUserDetails(id: number) {

    try {

      return this.usersRepository.findOne({ id })

    }
    catch (err) {
      this.logger.log(err)
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
      this.logger.log(err)
      throw new UnprocessableEntityException(err);
    }
  }

  async verifyUserEmail(token: string) {
    try {
      let user = await this.usersRepository.findOne({ tempToken: token })
      if (user) {
        user.status = Status.ACTIVE
        user.tempToken = null
        return await this.usersRepository.create(user)
      }
      else {
        throw new Error('Not a valid token write a support email')
      }
    }
    catch (err) {
      this.logger.log(err)
      throw new UnprocessableEntityException(err);
    }
  }

  async addMxDetailsToUser(id: number, mxUserDto: MxUserDto) {

    try {

      const user = await this.usersRepository.findOneAndUpdate(
        { id },
        mxUserDto,
      );

      return mxUserDto
    }
    catch (err) {
      this.logger.log(err)
      throw new UnprocessableEntityException(err);
    }
  }

  private async validateCreateUserDto(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({ email: createUserDto.email });
    if (existingUser && existingUser?.status != "Deleted") {
      this.logger.log('Email already exists')
      throw new UnprocessableEntityException('Email already exists');
    }
    return existingUser
  }

  async verifyUser(email: string, password: string) {

    try {

      const user = await this.usersRepository.findOne({ email });
      const passwordIsValid = await bcrypt.compare(password, user.password);
      if (!passwordIsValid) {
        this.logger.log('Credentials are not valid.')
        throw new UnauthorizedException('Credentials are not valid.');
      }
      return user;

    } catch (err) {
      throw new UnauthorizedException(err);
    }

  }

  async sendEmail(email: string, subject: string, text: string, cc?: string[]) {
    const transporter = nodemailer.createTransport({
      service: this.configService.get('EMAIL_SERVICE'),
      host: this.configService.get('MAILGUN_SMTP_HOSTNAME'),
      port: this.configService.get('MAILGUN_SMTP_PORT'),
      auth: {
        user: this.configService.get('MAILGUN_SMTP_USER'),
        pass: this.configService.get('MAILGUN_SMTP_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Define the type for mailOptions
    interface MailOptions {
      from: string;
      to: string;
      subject: string;
      html: string;
      cc?: string;
    }

    const mailOptions: MailOptions = {
      from: this.configService.get('MAILGUN_SENDER_EMAIL'),
      to: email,
      subject: subject,
      html: `${text}`,
    };

    if (cc && cc.length > 0) {
      mailOptions.cc = cc.join(', ');
    }

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
        const forgetPasswordUrl = `${this.configService.get('FE_URL')}/reset-password`
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
        this.logger.log('Invalid User!')
        throw new UnauthorizedException('Invalid User!');
      }
    }
    catch (err) {
      this.logger.log(err)
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
      this.logger.log(err)
      throw new UnauthorizedException('Invalid User!');
    }

  }

  private async validateUserWithReferalCode(email: string, referalCode: string) {

    try {

      return await this.userReferalRepo.findReferal(email, referalCode)

    }
    catch (err) {
      this.logger.log(err)
      throw new UnauthorizedException('Referal Code Or Email are not valid!');
    }

  }

  private async createUserVendorMap(uiderId: number) {

    const vendorIds = [8934, 56, 1]
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
        this.logger.log('Duplicate user-vendor entry')
        throw new UnprocessableEntityException('Duplicate user-vendor entry');
      } else {
        this.logger.log(err)
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
      this.logger.log(`${err.message}`)
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

  async supportEmail(supportEmailDto: SupportEmailDto) {

    let html = `<html> <body> <p> Sender Email :: ${supportEmailDto.email} </p> <p> Message ::  ${supportEmailDto.message} </p>
         </body></html>`;
    let subject = `Support Email !`;
    await this.sendEmail(this.configService.get('SUPPORT_RECEIVER_EMAIL'), subject, html);

    return true
  }

  private async restoreUser(user: any, id: number) {
    user.status = Status.ACTIVE
    user.deletedBy = null
    user.deletedAt = null

    try {
      return await this.usersRepository.findOneAndUpdate(
        { id },
        user,
      );
    } catch (err) {
      this.logger.log(err.message)
      throw new UnprocessableEntityException(err.message)
    }
  }

  async getUserIdByUsrGuid(guid: string) {
    try {

      return await this.usersRepository.getUserId(guid)
    }
    catch (err) {
      throw new NotFoundException(`${err.message}`);
    }
  }

  async sendMXHooksEmail(name: string, email: string, userGuid: string, memberGuid: string, totalTransaction: number) {
    try {


      let formDate = format(new Date(), 'yyyy-MM-dd');

      let emailContent = `
    <h1> Mx Web Hooks Transaction Summary</h1>
    <p>Date: ${formDate} </p>
    <table border="1" style="border-collapse: collapse;">
      <tr>
        <th>User Name</th>
        <th>User Email</th>
        <th>userGuid</th>
        <th>memberGuid</th>
        <th>Number of Transactions</th>
      </tr>
      <tr>
        <td>${name}</td>
        <td>${email}</td>
        <td>${userGuid}</td>
        <td>${memberGuid}</td>
        <td>${totalTransaction}</td>
      </tr>
      </table>`;

      // Send the email (assuming sendEmail is a method to send emails)
      return await this.sendEmail('piyush.p@hmcthree.com', 'MX Hooks Transaction', emailContent, ["mangesh.s@hmcthree.com", "jesse@teleperson.com", "eben.hall@hmcthree.com"]);
    }
    catch (err) {
      console.log("error in sending email::", err.message)
    }
  }

  async getUserMxTransctionData(userId:number,limit :number){
    try{
      return await this.mxUserTransctionRepo.getUserMxTransctionData(userId,limit)
    }
    catch(err){
      this.logger.log(`error in getting user mx data ${err} || ${err.message}`)
      throw new UnprocessableEntityException(`${err.message}`);
    }
  }


}

