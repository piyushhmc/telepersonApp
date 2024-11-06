import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { VendorRepository } from './vendors.repository';
import { ConfigService } from '@nestjs/config';
import { CreateVendorDto } from './dto/create-vendor.dto';

import { Vendors } from './models/vendors.entity';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import { parse } from "csv-parse/sync";
import axios from 'axios';
import { IntentRepository } from './intents.repository';
import { CreateOrUpdateVendorIntentDto } from './dto/createorupdatevendorintent.dto';
import { VendorIntents } from './models/vendor-intent.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Intents } from './models/intent.entity';
import { UserVendors } from './models/user-vendors.entity';
import { S3Service } from '../s3/s3.service';
import { Logger } from 'nestjs-pino';
import * as nodemailer from 'nodemailer';

@Injectable()
export class VendorsService {

    constructor(
        private readonly vendorsRepository: VendorRepository,
        private readonly intentRepository: IntentRepository,
        private readonly configService: ConfigService,
        @InjectRepository(VendorIntents)
        private readonly vendorIntentRepository: Repository<VendorIntents>,
        @InjectRepository(UserVendors)
        private readonly usersVendorsRepository: Repository<UserVendors>,
        private readonly s3Service: S3Service,
        private readonly logger: Logger

    ) { }

    async create(userId: number, createVendorDto: CreateVendorDto) {

        let name = createVendorDto.companyName.substring(0, 3);
        let date = (new Date()).getTime().toString(36)
        const vendor = new Vendors({})

        vendor.vendorCreatedBy = userId
        vendor.companyCode = `${name}_${date}`
        vendor.companyName = createVendorDto.companyName
        vendor.contactNumber = createVendorDto.contactNumber
        vendor.industry = createVendorDto.industry
        vendor.street1 = createVendorDto.street1
        vendor.city = createVendorDto.city
        vendor.state = createVendorDto.state
        vendor.zip = createVendorDto.zip
        vendor.country = createVendorDto.country
        vendor.revenue = createVendorDto.revenue
        vendor.employees = createVendorDto.employees
        vendor.linkedin = createVendorDto.linkedin
        vendor.subIndustry = createVendorDto.subIndustry
        vendor.websiteURL = createVendorDto.websiteUrl
        vendor.companyOverview = createVendorDto.companyOverview
        vendor.foundedYear = createVendorDto.founded
        vendor.approvalStatus = "PENDING"
        vendor.isPopular = 0
        vendor.isCommunityVendor = 0
        vendor.isdefaultVendor = 0
        vendor.isMX = false
        vendor.facebook = createVendorDto.facebook
        vendor.instagram = createVendorDto.instagram
        vendor.twitter = createVendorDto.twitter

        try {
            return await this.vendorsRepository.create(vendor);
        } catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(`error in creating vendor  ${err}`);
        }
    }

    async update(id: number, updateVendorDto: UpdateVendorDto) {

        try {
            return await this.vendorsRepository.findOneAndUpdate({ id }, updateVendorDto);
        } catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(`error in edit vendor  ${err}`);
        }
    }

    async createOrUpdateVendorIntent(vIntent: CreateOrUpdateVendorIntentDto) {
        try{
            let vendorIntent = await this.intentRepository.findOne({ intentName: vIntent.intentName })
            let IntentId = vendorIntent?.id
            const userEmailList = await this.vendorsRepository.getVendorSubscribedUserEmail(vIntent.vendorId )

            if (vendorIntent) {
                let res = await this.vendorIntentRepository.findOneBy({ intentId: IntentId, vendorId: vIntent.vendorId });
                if (res) {
                    let vendorIntentEntity = this.createVendorIntent(vIntent, vendorIntent.id)
                    try {
                        const updateResult = await this.vendorIntentRepository.update({ intentId: vendorIntent.id , vendorId: vIntent.vendorId }, vendorIntentEntity);
                        
                        if (!updateResult.affected) {
                            await this.vendorIntentRepository.save(vendorIntentEntity)
                        }

                        if(vIntent.isAllIntentAdded){
                            await this.vendorsRepository.findOneAndUpdate({id:vIntent.vendorId },{isAllIntentAdded:1,intentCompletedOn:new Date()})

                            await Promise.all(
                                userEmailList.map((item: { email: string,firstName:string }) => this.vendorIntentCompletedEmail(item.firstName, item.email))
                            );
                        }

                        return await this.vendorIntentRepository.findOneBy({ intentId: vendorIntent.id, vendorId: vIntent.vendorId });
                    } catch (err) {
                        this.logger.log(err)
                        throw new UnprocessableEntityException(`error in creating vendor Intent ${err}`);
                    }
                }
                else {
                    try {
                        const vendorIntent = this.createVendorIntent(vIntent, IntentId)
                        const data = await this.vendorIntentRepository.save(vendorIntent);

                        if(vIntent.isAllIntentAdded){
                            await this.vendorsRepository.findOneAndUpdate({id:vIntent.vendorId },{isAllIntentAdded:1,intentCompletedOn:new Date()})

                            await Promise.all(
                                userEmailList.map((item: { email: string,firstName:string }) => this.vendorIntentCompletedEmail(item.firstName, item.email))
                            );
                        }

                        return data

                    } catch (err) {
                        this.logger.log(err)
                        throw new UnprocessableEntityException(`error in creating vendor Intent ${err}`);
                    }
                }
            } else {
                try {
                    let intent = new Intents({})
                    intent.intentName = vIntent.intentName;
                    intent = await this.intentRepository.create(intent);
                    const vendorIntent = this.createVendorIntent(vIntent, intent.id)
                    if(vIntent.isAllIntentAdded){
                        await this.vendorsRepository.findOneAndUpdate({id:vIntent.vendorId },{isAllIntentAdded:1,intentCompletedOn:new Date()})

                        await Promise.all(
                            userEmailList.map((item: { email: string,firstName:string }) => this.vendorIntentCompletedEmail(item.firstName, item.email))
                        );
                    }
                    return await this.vendorIntentRepository.save(vendorIntent);
                } catch (err) {
                    this.logger.log(err)
                    throw new UnprocessableEntityException(`error in creating vendor Intent ${err}`);
                }
            }
        }
        catch(err){
            this.logger.log(err)
            throw new UnprocessableEntityException(`error in creating vendor Intent ${err}`);
        }
    }

    createVendorIntent(vIntent: CreateOrUpdateVendorIntentDto, intentId: number) {
        const vendorIntent = new VendorIntents({})
        const status = vIntent.status.toLowerCase() == 'completed' ? 1 : 0
        vendorIntent.algorithm = vIntent.algorithm ?? vendorIntent.algorithm;
        vendorIntent.buttonComments = vIntent.buttonComments ?? vendorIntent.buttonComments;
        vendorIntent.buttonDiscription = vIntent.buttonDescription ?? vendorIntent.buttonDiscription;
        vendorIntent.vendorId = vIntent.vendorId ?? vendorIntent.vendorId;
        vendorIntent.intentId = intentId;
        vendorIntent.status = status;
        return vendorIntent
    }

    async deleteVendorIntent(id: string) {
        try {
            return await this.vendorIntentRepository.delete(id);
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err);
        }

    }

    async getVendorIntent(id: number) {
        try {
            const rawQuery = `SELECT  i.intentName, vi.intentId, vi.algorithm, vi.status, vi.buttoncomments
            FROM intents i
            LEFT JOIN vendor_intents vi ON i.id = vi.intentId 
            where  vi.id =${id}`
            const result = await this.vendorIntentRepository.query(rawQuery)
            return result[0]
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err);
        }
    }

    async vendorList(search: string, page: number, orderBy: string, status: string) {

        const take = this.configService.get('PAGE_SIZE') || 25; // number of records to fetch per page
        return await this.vendorsRepository.vendorList(search, page, orderBy, take, status)
    }

    async vendorIntentsListbyVendorId(id: number, search: string, page: number, pageSize: number) {

        const take = this.configService.get('PAGE_SIZE') || 25; // number of records to fetch per page
        return await this.vendorsRepository.vendorIntentManagementListbyVendorId(id, search, page, pageSize)
    }

    //deleteUserVendor
    async deleteVendor(vendorId: number, userId: number) {
        try {
            //hard delete from user-vendor
            await this.usersVendorsRepository.delete({ vendorId })
            //hard delete from vendor-intent
            await this.vendorIntentRepository.delete({ vendorId });
            // soft delete from vendor table
            await this.vendorsRepository.findOneAndDelete({ id: vendorId })

        } catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err);
        }

    }

    async createVendorUsingCsv(filePath: string) {
        try {
            const data = parse(fs.readFileSync(filePath, 'utf8'));
            for (const row of data) {
                try {

                    const vendor = new Vendors({})
                    let name = row[2].substring(0, 3);
                    let date = (new Date()).getTime().toString(36)
                    const mxVendor = await this.getVendorFromMX(row[2])
                    let logoUrl = ""

                    if (mxVendor?.merchants.length > 0) {
                        logoUrl = mxVendor?.merchants[0].logo_url

                    }
                    let employee = 0

                    if (row[12] != "") {
                        employee = parseInt(row[12])
                    }
                    employee = employee ? employee : null


                    vendor.companyCode = `${name}_${date}`
                    vendor.companyName = row[2]
                    vendor.companyOverview = row[3]
                    vendor.websiteURL = row[4]
                    vendor.street1 = row[5]
                    vendor.city = row[6]
                    vendor.state = row[7]
                    vendor.zip = row[8]
                    vendor.country = row[9]
                    vendor.contactNumber = row[10]
                    vendor.revenue = row[11]
                    vendor.employees = employee
                    vendor.linkedin = row[13]
                    vendor.industry = row[14]
                    vendor.subIndustry = row[15]
                    vendor.logoUrl = row[16]
                    vendor.foundedYear = row[17]
                    vendor.approvalStatus = row[18]
                    vendor.isPopular = row[19]
                    vendor.isCommunityVendor = row[20]
                    vendor.isdefaultVendor = row[21]
                    vendor.vendorCreatedBy = 1
                    vendor.isMX = row[27]
                    vendor.logoUrl = logoUrl

                    // console.log("vendor ===> ",vendor)
                    // console.log("employee ===> ",employee)

                    await this.vendorsRepository.create(vendor);


                } catch (err) {
                    this.logger.log(`Error processing row:" ${err}`)
                    console.log("Error processing row:", err);
                }
            }
        } catch (err) {
            this.logger.log(`Error in readAndInsertData:, ${err}`)
            console.log("Error in readAndInsertData:", err);
        }
    }


    async getVendorFromMX(companyName: string) {

        const apiUrl = this.configService.get('MX_API');
        try {
            const response = await axios.get(`${apiUrl}?name=${companyName}`, {
                headers: {
                    Accept: 'application/vnd.mx.api.v1+json',
                    Authorization: this.getBasicAuthHeader(),

                },
            });

            return response.data;
        } catch (error) {
            // Handle errors
            this.logger.log(error.message)
            throw new Error(`Error fetching data: ${error.message}`);
        }

    }

    private getBasicAuthHeader(): string {
        const username = this.configService.get('MX_USER_NAME');
        const password = this.configService.get('MX_PASSWORD');
        const base64Credentials = Buffer.from(`${username}:${password}`).toString('base64');
        return `Basic ${base64Credentials}`;
    }

    async getVendordetails(id: number) {
        const vendorData = await this.vendorsRepository.findOne({ id: id })
        return this.replaceNullWithEmptyString(vendorData)

    }

    async intentList(search: string, page: number, orderBy: string) {

        try {
            const take = this.configService.get('PAGE_SIZE') || 25; // number of records to fetch per page
            return await this.intentRepository.intentList(search, page, orderBy, take)
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(`error in intent list  ${err}`);
        }

    }

    async vendorIntentManagementList(search: string, pageNo: number, orderBy: string, sortOnColumn: string) {
        try {
            const take = this.configService.get<number>('PAGE_SIZE') || 25;
            return await this.vendorsRepository.vendorIntentManagementList(search, pageNo, take, orderBy, sortOnColumn)
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(`error in vendor management list  ${err}`);
        }
    }

    async subscribevendorIntentManagementList(search: string, pageNo: number, orderBy: string, sortOnColumn: string) {
        try {
            const take = this.configService.get<number>('PAGE_SIZE') || 25;
            return await this.vendorsRepository.subscribeVendorIntentManagementList(search, pageNo, take, orderBy, sortOnColumn)
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(`error in vendor management list  ${err}`);
        }
    }

    async addVendorProfileImage(vendorid: number, file: Express.Multer.File) {

        const key = `vendor_logo/${vendorid}/${file.fieldname}${Date.now()}`
        let imageUrl = await this.s3Service.uploadFile(file, key)
        const updatedVendor = await this.vendorsRepository.findOneAndUpdate(
            { id: vendorid },
            { logoUrl: imageUrl },
        );

        return updatedVendor;
    }

    private async replaceNullWithEmptyString(obj: any) {

        for (let key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] === null) {
                obj[key] = ""; // Replace null with an empty string
            }
        }

        obj.employees = obj.employees == "" ? 0 : obj.employees

        return obj;
    }


    private async vendorIntentCompletedEmail(firstName:string,email:string){

        try{
            let html = `<html> <head> Hey ${firstName}, </head> <body> <p> New Vendor is added in your account!</p>
              <p>If you have any question at all, please don't hesitate to reach me at (727) 999-0544 or jesse@teleperson.com anytime!</p>
              <p>Thank you  for you!<p/><p>Jesse <br/>CEO,Co-founder<br/>Teleperson</p>
              </body></html>`
            let subject = `New Vendor activited in your account!`
      
            await this.sendEmail(email, subject, html)
        }
        catch(err){
            this.logger.log(err.message)
            throw new UnprocessableEntityException(`error in intent email send ${err.message}`);
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


}
