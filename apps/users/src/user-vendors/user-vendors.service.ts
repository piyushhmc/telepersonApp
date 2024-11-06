import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { UserVenndorsRepository } from './user-vendors.repository';
import { UserVendors } from './models/user-vendors.entity';
import { CreateUserVenndorsDto } from './dto/create-user-vendors.dto';
import { PatchUserVenndorsDto } from './dto/patch-user-vendors.dto';
import { VenndorsRepository } from './vendors.repository';
import { VendorDto } from './dto/vendor.dto';
import { Vendors } from './models/vendors.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { VendorIntents } from './models/vendor-intent.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import { IntentsRepository } from './intents.repository';
import { parse } from "csv-parse/sync";
import { RemoveUserVenndorsDto } from './dto/remove-user-vendors.dto';
import { number } from 'joi';
import { CommunityUserDto, CommunityVendorDto } from './dto/community-vendor.dto'
import axios from 'axios';
import { SupportEmailDto } from '../dto/support-email.dto';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { CreateMXUserDto } from './dto/create-mx-user.dto';
import { CompanyRatingDto } from './dto/company-rating.dto';
import { User } from '@app/common';
import { CompanyRating } from './models/company-rating';
import { TelepersonRatingDto } from './dto/teleperson-rating';
import { TelepersonRating } from './models/teleperson-rating';


interface VendorIdsResponse {
    userList: { vendorId: number }[];
    pageResult: { total: number; page: number; lastPage: number };
}



@Injectable()
export class UserVendorsService {
    constructor(
        private readonly usersVendorsRepository: UserVenndorsRepository,
        private readonly configService: ConfigService,
        private readonly venndorsRepository: VenndorsRepository,
        private readonly intentsRepository: IntentsRepository,
        @InjectRepository(VendorIntents)
        private readonly venndorIntentsRepository: Repository<VendorIntents>,
        @InjectRepository(CompanyRating)
        private readonly companyRatingRepository: Repository<CompanyRating>,
        @InjectRepository(TelepersonRating)
        private readonly telepersonRatingRepository: Repository<TelepersonRating>,
        private readonly logger: Logger
    ) { }

    async createUserVendorMap(userId: number, createUserVenndorsDto: CreateUserVenndorsDto) {
        const userVendor = new UserVendors({})
        userVendor.userId = userId;
        userVendor.vendorId = createUserVenndorsDto.vendorId;
        userVendor.isPlaidLinked = createUserVenndorsDto.isPlaidLinked;
        userVendor.isActive = true;
        userVendor.assignedDate = new Date();
        try {

            await this.validateVendor(createUserVenndorsDto.vendorId)
            // const existingUserVendors = await this.usersVendorsRepository.findUserVendorsWithIds(userId, createUserVenndorsDto.vendorId)
            // console.log("existingUserVendors:",existingUserVendors)
            // if (existingUserVendors != null) {
            //     return await this.usersVendorsRepository.upsertUserVendor(userVendor)
            // } else {
            return await this.usersVendorsRepository.create(userVendor)
            //}

        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                this.logger.log('Duplicate:vendor is already mapped')
                throw new UnprocessableEntityException('Duplicate:vendor is already mapped');
            } else {
                this.logger.log(err.message)
                throw new UnprocessableEntityException(err.message);
            }
        }
    }

    async patchUserVendorMap(userId: number, patchUserVenndorsDto: PatchUserVenndorsDto) {

        const userVendor = new UserVendors({})
        userVendor.isActive = patchUserVenndorsDto.isActive;
        try {
            return await this.usersVendorsRepository.findOneAndUpdate({ userId: userId, vendorId: patchUserVenndorsDto.vendorId }, userVendor)
        } catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err);
        }
    }

    async listUserVendorMap(userId: number, page: number = 1, take: number = 10) {

        const userVendorArray: any[] = [];

        try {

            return await this.usersVendorsRepository.userVendorList(userId, page, take)

        } catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err);
        }
    }

    async listVendors(search: string) {
        try {
            let mxData: any
            let listV: any
            listV = await this.venndorsRepository.listVendors(search, "companyName")
            listV = listV.map(vendor => {
                return { ...vendor};
            });

            if (listV.length == 0) {

                mxData = await this.getVendorFromMX(search)

                if (mxData?.merchants.length > 0) {

                    let transformedRecords = mxData.merchants.map((record, index) => {
                        return {
                            id: '',
                            companyCode: '',
                            companyName: record.name,
                            websiteURL: record.website_url,
                            logoUrl: record.logo_url,
                            isMX: true,
                            approvalStatus:'',
                        };
                    });

                    listV = transformedRecords

                }

            }


            return listV

        } catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err);
        }
    }

    async vendorDetails(vendorId: number) {
        try {
            return await this.venndorsRepository.findOne({ id: vendorId })
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err);
        }
    }

    private async validateVendor(id: number) {
        try {
            const vendor = await this.venndorsRepository.findOne({ id: id })

            if (vendor?.id > 0) {
                return true
            } else {
                this.logger.log("invalid vendor")
                throw new UnprocessableEntityException("invalid vendor");
            }
        }
        catch (err) {
            this.logger.log("invalid vendor")
            throw new UnprocessableEntityException(err);
        }
    }

    async addVendorByUser(userId: number, createvendorDto: CreateVendorDto) {

        const vendor = new Vendors({})
        let vendorStatus = "SUBMITTED";
        let name = createvendorDto.companyName.substring(0, 3);
        let date = (new Date()).getTime().toString(36)
        vendor.vendorCreatedBy = userId;
        vendor.companyCode = `${name}_${date}`;
        vendor.companyName = createvendorDto.companyName;
        vendor.websiteURL = createvendorDto.websiteUrl
        vendor.logoUrl = createvendorDto.logoUrl
        vendor.isMX = createvendorDto.isMX

        if (createvendorDto.isMX) {
            vendorStatus = "PENDING"
        }

        vendor.approvalStatus = vendorStatus;

        try {

            let createUserVenndorsDto = new CreateUserVenndorsDto

            if (createvendorDto.companyCode !== "") {
                const vendorDetails = await this.checkCompanyByCode(createvendorDto.companyCode)
                if (vendorDetails?.deletedAt == null) {
                    createUserVenndorsDto.isPlaidLinked = 1,
                        createUserVenndorsDto.vendorId = vendorDetails.id
                    return await this.createUserVendorMap(userId, createUserVenndorsDto)

                } else {
                    createUserVenndorsDto.isPlaidLinked = 1,
                        createUserVenndorsDto.vendorId = vendorDetails.id
                    vendor.companyCode = createvendorDto.companyCode
                    await this.restoreVendor(vendorDetails.id, vendor)
                    return await this.createUserVendorMap(userId, createUserVenndorsDto)
                }

            } else {
                const vendorDetails = await this.venndorsRepository.create(vendor)
                createUserVenndorsDto.isPlaidLinked = 1,
                    createUserVenndorsDto.vendorId = vendorDetails.id
                return await this.createUserVendorMap(userId, createUserVenndorsDto)

            }
        } catch (err) {
            this.logger.log(`error in vendor create  ${err}`)
            throw new UnprocessableEntityException(`error in vendor create  ${err}`);
        }
    }

    async checkCompanyByCode(code: string) {
        try {
            let vendor = await this.venndorsRepository.findOne({ companyCode: code })
            if (vendor == undefined || vendor == null) {
                throw new UnprocessableEntityException('invalid vendor')
            }
            return vendor;
        } catch (err) {
            this.logger.log('invalid vendor')
            throw new UnprocessableEntityException('invalid vendor')
        }

    }

    async vendorIntent(vendorId: number): Promise<VendorIntents[]> {

        const query = `
            SELECT 
            vi.intentId,
            vi.vendorId,
            i.intentName,
            vi.voiceEngine,
            vi.interruptVoiceEngine,
            vi. waitTime,
            vi. keyWord,
            vi.algorithm,
            i.intentName,
            i.buttonDesc
            FROM vendor_intents as vi
            LEFT JOIN intents as i ON i.id = vi.intentId where vendorId=${vendorId} AND vi.status = ${1}`;
        const results = await this.venndorIntentsRepository.query(query);
        return results;

    }

    async popularVendor() {
        try {
            const popularVendorsList: any = {};
            const popularVendors = await this.venndorsRepository.listPopularVendor()
            for (const pv of popularVendors) {

                const industry = pv.vendors_industry;

                if (!popularVendorsList[industry]) {
                    popularVendorsList[industry] = [];
                }

                popularVendorsList[industry].push({
                    id: pv.vendors_id,
                    companyName: pv.vendors_companyName,
                    logoUrl: pv.vendors_logoUrl,
                });
            };

            return popularVendorsList

        } catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err)
        }
    }

    async communityVendor() {
        try {
            const communityVendors = await this.venndorsRepository.listCommunityVendor();
            return communityVendors;

        } catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err)
        }
    }

    async readAndInsertData(filePath: string) {
        try {
            const data = parse(fs.readFileSync(filePath, 'utf8'));
            for (const row of data) {
                try {
                    let vendorId: number;
                    let intentId: number;

                    if (row[0] != "") {
                        const vendor = await this.venndorsRepository.findOne({ companyName: row[0] });
                        if (!vendor) throw new Error(`Vendor with name ${row.companyName} not found`);
                        vendorId = vendor.id;
                    }

                    if (row[5] != "") {
                        const intent = await this.intentsRepository.findOne({ intentName: row[5] });
                        if (!intent) throw new Error(`Intent with name ${row.intentName} not found`);
                        intentId = intent.id;

                    }

                    const vendorIntents = new VendorIntents({});

                    vendorIntents.intentId = intentId;
                    vendorIntents.vendorId = vendorId;
                    vendorIntents.voiceEngine = row[1];
                    vendorIntents.interruptVoiceEngine = row[2];
                    vendorIntents.algorithm = row[4];
                    vendorIntents.waitTime = row[3];

                    const vIMap = this.venndorIntentsRepository.create(vendorIntents);
                    const createdVIM = await this.venndorIntentsRepository.save(vIMap);



                } catch (err) {
                    this.logger.log(err)
                    console.log("Error processing row:", err);
                }
            }
        } catch (err) {
            this.logger.log(err)
            console.log("Error in readAndInsertData:", err);
        }
    }

    async updateMasterVendorData(filePath: string) {
        try {
            const data = parse(fs.readFileSync(filePath, 'utf8'));
            for (const row of data) {
                try {
                    let id: number = row[0];


                    if (row[0] != "") {
                        const vendor = await this.venndorsRepository.findOne({ id: row[0] });
                        
                        if (vendor) 
                        {
                            const vendor = new Vendors({})

                            vendor.companyName = row[1];
                            vendor.websiteURL = row[2];
                            vendor.industry = row[3];
                            vendor.subIndustry = row[4];
                            vendor.companyOverview = row[6];
                            vendor.foundedYear = row[7];
                            vendor.street1 = row[8];
                            vendor.city = row[9];
                            vendor.zip = row[10]
                            vendor.state = row[11];
                            vendor.country = row[12];
                            vendor.facebook = `https://www.facebook.com/${row[13]}`;
                            vendor.twitter = `https://x.com/${row[15]}`;
                            vendor.linkedin = `https://www.linkedin.com/${row[14]}`;
                            vendor.contactNumber = row[18];
                            vendor.employees = row[19]
                            const user = await this.venndorsRepository.findOneAndUpdate(
                                { id },
                                vendor,
                            );
                        }

                    }
                } catch (err) {
                    this.logger.log("Error processing row:", err)
                    console.log("Error processing row:", err);
                }
            }
        } catch (err) {
            this.logger.log("Error in readAndInsertData:", err)
            console.log("Error in readAndInsertData:", err);
        }
    }

    async updateVendorIntentData(filePath: string) {
        try {
            const data = parse(fs.readFileSync(filePath, 'utf8'));
            for (const row of data) {
                try {
                    let vid: number = row[0];
                    console.log("row[2] algo===",row[2])
                    if (row[0] != "") {
                        const vendorintent = await this.venndorIntentsRepository.findBy({vendorId: row[0]});
                        
                        if (vendorintent && vendorintent.length>=1) 
                        {
                            for(let i=0 ; i<vendorintent.length;i++){
                                const VI = new VendorIntents({})
                                VI.algorithm = row[2];
                                VI.status = 1;
                                VI.intentId=3756;
                                 await this.venndorIntentsRepository.update(
                                    { vendorId :vid },
                                    VI,
                                );
                            }

                        }else{
                            const VI = new VendorIntents({})
                            VI.algorithm = row[2];
                            VI.status = 1;
                            VI.intentId=3756;
                            VI.vendorId=row[0];
                             await this.venndorIntentsRepository.save(
                                VI
                            );

                        }

                    }
                } catch (err) {
                    this.logger.log("Error processing row:", err)
                    console.log("Error processing row:", err);
                }
            }
        } catch (err) {
            this.logger.log("Error in readAndInsertData:", err)
            console.log("Error in readAndInsertData:", err);
        }
    }

    async removeUserVendorMap(userId: number, removeUserVenndorsDto: RemoveUserVenndorsDto) {

        // const userVendor = new UserVendors({})
        // userVendor.isActive = false;
        // userVendor.deletedAt = new Date();
        // userVendor.deletedBy = userId;

        try {
            return await this.usersVendorsRepository.findOneAndDelete({ userId: userId, vendorId: removeUserVenndorsDto.vendorId })
        } catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err);
        }

    }

    async removeUserVendorList(userId: number, page: number = 1, take: number = 10) {
        const userVendorArray: any[] = [];

        try {
            return await this.usersVendorsRepository.removedUserVendorList(userId, page, take)

        } catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err);
        }

    }

    async communityVendorList(userId: number, page: number, take: number) {

        try {
            const userIds = await this.usersVendorsRepository.getCommunityUsersVendor(userId, page, take)

            const uIds = await userIds.map(user => user.userId);
            // console.log("-----", uIds.length)
            let data = {
                "community-Vendors": []
            }
            if (uIds.length !== 0) {
                const communityVendor = await this.usersVendorsRepository.getCommunityUserVendor(uIds, userId)

                data['community-Vendors'] = await this.getCommunity(communityVendor)

            }

            return data

        }
        catch (err) {
            this.logger.log(err.message)
            throw new UnprocessableEntityException(err.message);
        }
    }

    async allCommunityVendorList(userId: number, page: number, take: number) {

        try {
            let userVendor = await this.usersVendorsRepository.find({ userId: userId })
            let vendorids = userVendor.map((uv) => uv.vendorId)
            let uniqueVendorids = [...new Set(vendorids)];;
            return await this.usersVendorsRepository.findAllCommunityVendors(uniqueVendorids, userId)
        }
        catch (err) {
            this.logger.log(err.message)
            throw new UnprocessableEntityException(err.message);
        }
    }

    async getCommunityVendorBYUserId(userId: number, page: number = 1, pageSize: number = 10) {

        try {

            const data = await this.usersVendorsRepository.getCommunityVendorBYUserId(userId, page, pageSize)
            let communityUser = this.getCommunityUsers(data)
            let communityUserVendors = this.getCommunityVendors(data)

            // console.log("data", communityUser)

            return {
                "user": communityUser[0],
                "userVendor": communityUserVendors
            }

        }
        catch (err) {
            this.logger.log(err.message)
            throw new UnprocessableEntityException(err.message);
        }
    }

    async getCompanyRatingBYVendorId(vendorId: number) {

        try {
            const rawQuery = `SELECT vendorId, AVG(rating) AS average_rating
            FROM company_rating
            WHERE vendorId = ${vendorId}
            GROUP BY vendorId`
            const result = await this.companyRatingRepository.query(rawQuery)
            return result[0]
        }
        catch (err) {
            this.logger.log(err.message)
            throw new UnprocessableEntityException(err.message);
        }
    }

    async getTelepersonRatingBYVendorId(vendorId: number) {

        try {
            const rawQuery = `SELECT vendorId, AVG(rating) AS average_rating
            FROM teleperson_rating
            WHERE vendorId = ${vendorId}
            GROUP BY vendorId`
            const result = await this.companyRatingRepository.query(rawQuery)
            return result[0]
        }
        catch (err) {
            this.logger.log(err.message)
            throw new UnprocessableEntityException(err.message);
        }
    }

    async listCommunityVendor(userId: number, page: number, take: number) {
        try {
            return await this.usersVendorsRepository.listCommunityVendor(userId, page, take);

        }
        catch (err) {
            this.logger.log(err.message)
            throw new UnprocessableEntityException(err.message);
        }
    }

    getCommunity(data: any) {

        const userVendorsMap = new Map();

        // Iterate through the data array
        data.forEach(entry => {
            const userId = entry.userId;

            // If the user is not already in the map, add them with an empty array for vendors
            if (!userVendorsMap.has(userId)) {
                userVendorsMap.set(userId, {
                    userId: userId,
                    firstName: entry.firstName,
                    lastName: entry.lastName,
                    profileImage: entry.profileImage,
                    vendors: [],
                });
            }

            // Add the vendor details to the user's vendors array
            userVendorsMap.get(userId).vendors.push({
                userVendorId: entry.userVendorId,
                vendorId: entry.vendorId,
                vendorName: entry.vendorName,
                vendorLogo: entry.vendorLogo,
                approvalStatus:entry.approvalStatus,
            });
        });

        // Convert the map values back to an array for easier consumption
        const userVendorDetailsArray = Array.from(userVendorsMap.values());

        return userVendorDetailsArray;
    }

    getCommunityUsers(data: any): CommunityUserDto[] {
        const filteredData = data.filter((item, index) => {
            return index === 0; // This will include only the first element
        });

        return filteredData.map(item => ({

            userId: item.userId,
            profileImage: item.profileImage,
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            facebook: item.facebook,
            linkedin: item.linkedin,
            twitter: item.twitter,
            instagram: item.instagram,
        }));

    }

    getCommunityVendors(data: any): CommunityVendorDto[] {
        return data.map(item => ({
            vendorId: item.vendorId,
            name: item.name,
            logo: item.logo,
            approvalStatus: item.approvalStatus,
        }));
    }

    async communityUserList(userId: number) {

        try {

            const userIds = await this.usersVendorsRepository.getCommunityUsers(userId)
            const uIds = userIds.map(user => user.userId);
            const communityUsers = await this.usersVendorsRepository.getCommunityUserDetails(uIds)

            return {
                users: communityUsers,
                count: uIds.length
            }
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err);
        }
    }

    async vendorUserList(vendorId: number, userid: number) {

        try {

            const vendorUsers = await this.usersVendorsRepository.getVendorUserDetails(vendorId, userid)
            return {
                users: vendorUsers,
            }
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err);
        }
    }

    async getVendorFromMX(companyName: string) {

        const apiUrl = `${this.configService.get('MX_API')}/merchants?name=${companyName}`;
        try {
            const response = await axios.get(`${apiUrl}`, {
                headers: {
                    Accept: 'application/vnd.mx.api.v1+json',
                    Authorization: this.getBasicAuthHeader(),
                },
            });

            return response.data;
        } catch (error) {
            // Handle errors
            this.logger.log(`Error fetching data: ${error.message}`)
            throw new Error(`Error fetching data: ${error.message}`);
        }

    }

    private getBasicAuthHeader(): string {
        const username = this.configService.get('MX_USER_NAME');
        const password = this.configService.get('MX_PASSWORD');
        const base64Credentials = Buffer.from(`${username}:${password}`).toString('base64');
        return `Basic ${base64Credentials}`;
    }

    async UpdateVendoScript() {
        try {
            const lastId = await this.venndorsRepository.getLastVendorId();

            for (let i = 0; i < lastId; i++) {
                const vendorD = await this.venndorsRepository.getVendor(i);
                if (vendorD?.guid == "" || vendorD?.guid == null) {
                    const mxData = await this.getVendorFromMX(vendorD?.companyName);

                    if (mxData?.merchants.length > 0) {
                        let isCompanyMatch = false;
                        for (const record of mxData.merchants) {
                            if (vendorD.companyName == record.name) {
                                isCompanyMatch = true;
                                // console.log("inside if 2 check company name match");
                                // console.log("inside 2nd if", vendorD.companyName, "==", record.name);
                                const updated = await this.venndorsRepository.updateVendor(vendorD?.id, {
                                    guid: record.guid
                                });

                                if (isCompanyMatch) {
                                    break; // Break out of the loop if isCompanyMatch is true
                                }
                            }
                        }
                    }
                }
                // console.log("vendor logo", vendorD?.guid);
                // console.log("vendorD", vendorD);
            }
        } catch (err) {
            this.logger.log("Error in UpdateVendorImageScript:", err)
            console.error("Error in UpdateVendorImageScript:", err);
        }
    }

    private async restoreVendor(id: number, vendor: Vendors) {
        try {

            vendor.deletedBy = null
            vendor.deletedAt = null
            return await this.venndorsRepository.findOneAndUpdate(
                { id },
                vendor,
            );
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err.message)
        }
    }

    async getMXUsers(email: string) {

        const apiUrl = `${this.configService.get('MX_API')}/users?email=${email}`;
        try {
            const response = await axios.get(`${apiUrl}`, {
                headers: {
                    Accept: 'application/vnd.mx.api.v1+json',
                    Authorization: this.getBasicAuthHeader(),
                },
            });

            return response.data;
        } catch (error) {
            // Handle errors
            this.logger.log(`Error fetching data: ${error.message}`)
            throw new Error(`Error fetching data: ${error.message}`);
        }

    }

    async getMXUsersTransction(guid: string, formDate: string, toDate: string) {

        const apiUrl = `${this.configService.get('MX_API')}/users/${guid}/transactions?from_date=${formDate}&to_date=${toDate}`;
        try {
            const response = await axios.get(`${apiUrl}`, {
                headers: {
                    Accept: 'application/vnd.mx.api.v1+json',
                    Authorization: this.getBasicAuthHeader(),
                },
            });

            return response.data;
        } catch (error) {
            // Handle errors
            this.logger.log(`Error fetching data: ${error.message}`)
            throw new Error(`Error fetching data: ${error.message}`);
        }

    }

    async requestwidgetURL(guid: string) {

        const apiUrl = `${this.configService.get('MX_API')}/users/${guid}/connect_widget_url`;
        try {
            const response = await axios.post(apiUrl, {}, {
                headers: {
                    'Accept': 'application/vnd.mx.api.v1+json',
                    'Authorization': this.getBasicAuthHeader(),
                },
            });
            return response.data;
        } catch (error) {
            console.log("error:", error.message)
            // Handle errors
            this.logger.log(`Error fetching data: ${error.message}`)
            throw new Error(`Error fetching data: ${error.message}`);
        }

    }

    async createMXUser(createMXUserDto: CreateMXUserDto) {
        try {
            const data = {
                user: {
                    email: createMXUserDto.email,
                    id: createMXUserDto.id,
                    is_disabled: false,
                    metadata: JSON.stringify({
                        first_name: createMXUserDto.firstName,
                        last_name: createMXUserDto.lastName,
                    }),
                },
            };
            const apiUrl = `${this.configService.get('MX_API')}/users`;
            const response = await axios.post(apiUrl, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.mx.api.v1+json',
                    'Authorization': this.getBasicAuthHeader(),
                },
            });

            return response.data;
        }
        catch (error) {
            this.logger.log(`Error posting data: ${error.message}`)
            throw new Error(`Error posting data: ${error.message}`);
        }
    }

    async addOrUpdateCompanyRating(companyRatingDto: CompanyRatingDto, user: User) {
        let result
        let companyRating = await this.companyRatingRepository.findOne({
            where: {
                userId: user.id,
                vendorId: companyRatingDto.vendorId
            }
        })

        if (companyRating) {
            companyRating.rating = companyRatingDto.rating
            companyRating.userId = user.id
            result = await this.companyRatingRepository.update({ vendorId: companyRatingDto.vendorId, userId: user.id }, companyRating)
            result = await this.companyRatingRepository.findOneBy({ vendorId: companyRatingDto.vendorId, userId: user.id });

        } else {
            let companyRatingInput = { ...companyRatingDto, userId: user.id }
            result = await this.companyRatingRepository.save(companyRatingInput)
        }
        return result
    }

    async addOrUpdateTelepersonRating(telepersonRatingDto: TelepersonRatingDto, user: User) {
        let result
        let telepersonRating = await this.telepersonRatingRepository.findOne({
            where: {
                userId: user.id,
                vendorId: telepersonRatingDto.vendorId
            }
        })

        if (telepersonRating) {
            telepersonRating.rating = telepersonRatingDto.rating;
            telepersonRating.userId = user.id
            result = await this.telepersonRatingRepository.update({ vendorId: telepersonRatingDto.vendorId, userId: user.id }, telepersonRating)
            result = await this.telepersonRatingRepository.findOneBy({ vendorId: telepersonRatingDto.vendorId, userId: user.id });

        } else {
            let telepersonRatingInput = { ...telepersonRatingDto, userId: user.id }
            result = await this.telepersonRatingRepository.save(telepersonRatingInput)
        }
        return result
    }

    async getTopVendors(userId:number){
        try{
            return await await this.usersVendorsRepository.getTopVendors(userId)
        }
        catch(error){
            console.log("error ===",error.message)
            throw new Error(`Error executing raw query: ${error.message}`);
        }
    }

}




