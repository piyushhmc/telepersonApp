import { Injectable, UnprocessableEntityException } from '@nestjs/common';
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

@Injectable()
export class VendorsService {

    constructor(
        private readonly vendorsRepository: VendorRepository,
        private readonly intentRepository:IntentRepository,
        private readonly configService: ConfigService
    ){}

    async create(userId:number,createVendorDto: CreateVendorDto) {

        let name = createVendorDto.companyName.substring(0, 3);
        let date = (new Date()).getTime().toString(36)
        const vendor = new Vendors({})
        
        vendor.vendorCreatedBy= userId
        vendor.companyCode= `${name}_${date}`
        vendor.companyName= createVendorDto.companyName
        vendor.contactNumber= createVendorDto.contactNumber
        vendor.industry= createVendorDto.industry
        vendor.street1= createVendorDto.street1
        vendor.city= createVendorDto.city
        vendor.state= createVendorDto.state
        vendor.zip= createVendorDto.zip
        vendor.country= createVendorDto.country
        vendor.revenue = createVendorDto.revenue
        vendor.employees = createVendorDto.employees
        vendor.linkedin =createVendorDto.linkedin
        vendor.subIndustry = createVendorDto.subIndustry
        vendor.websiteURL = createVendorDto.websiteUrl
        vendor.companyOverview = createVendorDto.companyOverview
        vendor.foundedYear = createVendorDto.founded
        vendor.approvalStatus = "ACTIVE"
        vendor.isPopular = 0
        vendor.isCommunityVendor = 0
        vendor.isdefaultVendor = 0
        vendor.isMX = false

        try{
            return  await this.vendorsRepository.create(vendor);
        }catch(err){
            throw new UnprocessableEntityException(`error in creating vendor  ${err}`);
        }
    }

    async update(id:number,updateVendorDto: UpdateVendorDto) {
        
        try{
            return  await this.vendorsRepository.findOneAndUpdate({id},updateVendorDto);
        }catch(err){
            throw new UnprocessableEntityException(`error in edit vendor  ${err}`);
        }
    }


    async vendorList(search:string,page:number,orderBy:string){

        const take = this.configService.get('PAGE_SIZE')||25; // number of records to fetch per page
        return await this.vendorsRepository.vendorList(search,page,orderBy,take)
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
                    let logoUrl= ""

                    if (mxVendor?.merchants.length > 0) {
                        logoUrl = mxVendor?.merchants[0].logo_url

                    }
                    let employee = 0

                    if(row[12]!=""){
                        employee = parseInt(row[12])
                    }
                    employee = employee?employee:null


                    vendor.companyCode = `${name}_${date}`
                    vendor.companyName = row[2]
                    vendor.companyOverview = row[3]
                    vendor.websiteURL = row[4]
                    vendor.street1 = row[5]
                    vendor.city = row[6]
                    vendor.state = row[7]
                    vendor.zip = row[8]
                    vendor.country = row[9]
                    vendor.contactNumber=row[10]
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
                    console.log("Error processing row:", err);
                }
            }
        } catch (err) {
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
            throw new Error(`Error fetching data: ${error.message}`);
        }

    }

    private getBasicAuthHeader(): string {
        const username = this.configService.get('MX_USER_NAME');
        const password = this.configService.get('MX_PASSWORD');
        const base64Credentials = Buffer.from(`${username}:${password}`).toString('base64');
        return `Basic ${base64Credentials}`;
    }

    async getVendordetails(id:number){
        return await this.vendorsRepository.findOne({ id: id })
    }

    async intentList(search:string,page:number,orderBy:string){
    
        try{
            const take = this.configService.get('PAGE_SIZE')||25; // number of records to fetch per page
            return await this.intentRepository.intentList(search,page,orderBy,take)
        }
        catch(err){
            throw new UnprocessableEntityException(`error in intent list  ${err}`);
        }
        
    }

    async vendorIntentManagementList(search:string,pageNo:number){
        try{
            const take = this.configService.get<number>('PAGE_SIZE')||25;
            return await this.vendorsRepository.vendorIntentManagementList(search,pageNo,take)
        }
        catch(err){
            throw new UnprocessableEntityException(`error in vendor management list  ${err}`);
        }
    }
}
