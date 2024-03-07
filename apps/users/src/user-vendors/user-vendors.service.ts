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

            const existingUserVendors = await this.usersVendorsRepository.findUserVendorsWithIds(userId, createUserVenndorsDto.vendorId)

            if (existingUserVendors != null) {
                return await this.usersVendorsRepository.upsertUserVendor(userVendor)
            } else {
                return await this.usersVendorsRepository.create(userVendor)
            }

        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                throw new UnprocessableEntityException('Duplicate user-vendor entry');
            } else {
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
            throw new UnprocessableEntityException(err);
        }
    }

    async listUserVendorMap(userId: number, page: number = 1, take: number = 10) {

        const userVendorArray: any[] = [];

        try {

            return await this.usersVendorsRepository.userVendorList(userId, page, take)

        } catch (err) {
            throw new UnprocessableEntityException(err);
        }
    }

    async listVendors(search: string) {
        try {
            let mxData: any
            let listV: any

            listV = await this.venndorsRepository.listVendors(search, "companyName")
            listV = listV.map(vendor => {
                return { ...vendor, isMX: false };
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
                            isMX: true
                        };
                    });

                    listV = transformedRecords

                }

            }

            
            return listV

        } catch (err) {
            throw new UnprocessableEntityException(err);
        }
    }

    async vendorDetails(vendorId: number) {
        try {
            return await this.venndorsRepository.findOne({ id: vendorId })
        }
        catch (err) {
            throw new UnprocessableEntityException(err);
        }
    }

    private async validateVendor(id: number) {
        try {
            const vendor = await this.venndorsRepository.findOne({ id: id })

            if (vendor.id > 0) {
                return true
            } else {
                return false
            }
        }
        catch (err) {
            throw new UnprocessableEntityException(err);
        }
    }

    async addVendorByUser(userId: number, createvendorDto: CreateVendorDto) {

        const vendor = new Vendors({})
        let vendorStatus = "PENDING"; 
        let name = createvendorDto.companyName.substring(0, 3);
        let date = (new Date()).getTime().toString(36)
        vendor.vendorCreatedBy = userId;
        vendor.companyCode = `${name}_${date}`;
        vendor.companyName = createvendorDto.companyName;
        vendor.websiteURL = createvendorDto.websiteUrl
        vendor.logoUrl=createvendorDto.logoUrl
        vendor.isMX=createvendorDto.isMX
        
        if (createvendorDto.isMX){
            vendorStatus = "ACTIVE"
        }

        vendor.approvalStatus = vendorStatus;

        try {

            let createUserVenndorsDto = new CreateUserVenndorsDto

            if (createvendorDto.companyCode !== "") {
                const vendorDetails = await this.checkCompanyByCode(createvendorDto.companyCode)
                if (vendorDetails !== null) {

                    createUserVenndorsDto.isPlaidLinked = 1,
                    createUserVenndorsDto.vendorId = vendorDetails.id
                    return await this.createUserVendorMap(userId, createUserVenndorsDto)

                }
            } else {

                const vendorDetails = await this.venndorsRepository.create(vendor)
                createUserVenndorsDto.isPlaidLinked = 1,
                createUserVenndorsDto.vendorId = vendorDetails.id
                return await this.createUserVendorMap(userId, createUserVenndorsDto)

            }
        } catch (err) {

            throw new UnprocessableEntityException(`error in vendor create  ${err}`);
        }
    }

    async checkCompanyByCode(code: string) {
        try {
            return await this.venndorsRepository.findOne({ companyCode: code })
        } catch (err) {
            throw new UnprocessableEntityException('vendor not found')
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
            LEFT JOIN intents as i ON i.id = vi.intentId where vendorId=${vendorId}`;
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
            throw new UnprocessableEntityException(err)
        }
    }

    async communityVendor() {
        try {
            const communityVendors = await this.venndorsRepository.listCommunityVendor();
            return communityVendors;

        } catch (err) {
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
                        console.log("intentId====:", intentId)
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

                    console.log("createdVIM====:", createdVIM)

                } catch (err) {
                    console.log("Error processing row:", err);
                }
            }
        } catch (err) {
            console.log("Error in readAndInsertData:", err);
        }
    }

    async updateMasterVendorData(filePath: string) {
        try {
            const data = parse(fs.readFileSync(filePath, 'utf8'));
            for (const row of data) {
                try {
                    let id: number;


                    if (row[0] != "") {
                        const vendor = await this.venndorsRepository.findOne({ companyCode: row[0] });
                        if (!vendor) throw new Error(`Vendor with name ${row.companyCode} not found`);
                        id = vendor.id;
                    }



                    const vendor = new Vendors({})

                    vendor.foundedYear = row[1];


                    const user = await this.venndorsRepository.findOneAndUpdate(
                        { id },
                        vendor,
                    );


                } catch (err) {
                    console.log("Error processing row:", err);
                }
            }
        } catch (err) {
            console.log("Error in readAndInsertData:", err);
        }
    }

    async removeUserVendorMap(userId: number, removeUserVenndorsDto: RemoveUserVenndorsDto) {

        const userVendor = new UserVendors({})
        userVendor.isActive = false;
        userVendor.deletedAt = new Date();
        userVendor.deletedBy = userId;

        try {
            return await this.usersVendorsRepository.findOneAndUpdate({ userId: userId, vendorId: removeUserVenndorsDto.vendorId }, userVendor)
        } catch (err) {
            throw new UnprocessableEntityException(err);
        }

    }

    async removeUserVendorList(userId: number, page: number = 1, take: number = 10) {
        const userVendorArray: any[] = [];

        try {
            return await this.usersVendorsRepository.removedUserVendorList(userId, page, take)

        } catch (err) {
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
            throw new UnprocessableEntityException(err.message);
        }
    }

    async getCommunityVendorBYUserId(userId: number, page: number = 1, pageSize: number = 10) {

        try {
            const data = await this.usersVendorsRepository.getCommunityVendorBYUserId(userId, page, pageSize)

            let communityUser = await this.getCommunityUsers(data)
            let communityUserVendors = await this.getCommunityVendors(data)

            // console.log("data", communityUser)

            return {
                "user": communityUser[0],
                "userVendor": communityUserVendors
            }

        }
        catch (err) {
            throw new UnprocessableEntityException(err.message);
        }
    }

    async listCommunityVendor(userId: number, page: number, take: number) {
        try {
            return await this.usersVendorsRepository.listCommunityVendor(userId, page, take);

        }
        catch (err) {
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
            throw new UnprocessableEntityException(err);
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
            throw new Error(`Error fetching data: ${error.message}`);
        }

    }

    private getBasicAuthHeader(): string {
        const username = this.configService.get('MX_USER_NAME');
        const password = this.configService.get('MX_PASSWORD');
        const base64Credentials = Buffer.from(`${username}:${password}`).toString('base64');
        return `Basic ${base64Credentials}`;
    }


}




