import { Body, Controller, Get, Param, Post, Put, Query, UnprocessableEntityException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CurrentUser, JwtAuthGuard, Roles, User } from '@app/common';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { Common } from '../utils/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller()
export class VendorsController {
    constructor(
        private readonly vendorsService:VendorsService,
        private readonly common: Common) {}
    
    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Post('vendors')
    createVendor(
        @Body() createVenndorsDto: CreateVendorDto,
        @CurrentUser() user:User
    ){
        return this.vendorsService.create(user.id,createVenndorsDto)
    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Put('vendors/:id')
    async updateVendor(
        @Body() updateVenndorsDto: UpdateVendorDto,
        @Param('id') id: string
    ){
        try{
            return this.vendorsService.update(+id,updateVenndorsDto)
        }
        catch(err){
            throw new UnprocessableEntityException(err)
        }
        
    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Get('vendors')
    async vendorList(
        @Query('search') search: string,
        @Query('page') pageNo: string,
        @Query('orderBy') orderBy: string,
    ) {

        try {
            const page = (pageNo != undefined && pageNo != "" )? pageNo:"1";
            const sort = (orderBy != undefined && orderBy != "" )? orderBy:"desc";
            const vendorList = await this.vendorsService.vendorList(search, +page, sort)

            return this.common.makeSuccessResponse(vendorList, 200)
        }
        catch (err) {
            throw new UnprocessableEntityException(err)
        }


    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Get('vendors/:id')
    async vendorDetails(@Param('id') id: string) {
        try {

            const vendorDetails = await this.vendorsService.getVendordetails(+id)
            return this.common.makeSuccessResponse(vendorDetails, 200)
        }
        catch (err) {
            throw new UnprocessableEntityException(err)
        }


    }

    @Roles('Admin')
    @Post('vendors/csvUpload')
    @UseInterceptors(FileInterceptor('filename', { dest: './uploads' }))
    async uploadFile(@UploadedFile() files: Express.Multer.File) {
    //   console.log("files====>",files);
      //readAndInsertData
      await this.vendorsService.createVendorUsingCsv(files.path);

    return { message: 'Data inserted successfully' }; 
    }

   
    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Get('intents')
    async intentList(
        @Query('search') search: string,
        @Query('page') pageNo: string,
        @Query('orderBy') orderBy: string,
    ) {
        try {
            const page = (pageNo != undefined && pageNo != "" )? pageNo:"1";
            const sort = (orderBy != undefined && orderBy != "" )? orderBy:"desc";
            const intentList = await this.vendorsService.intentList(search, +page, sort)

            return this.common.makeSuccessResponse(intentList, 200)
        }
        catch (err) {
            throw new UnprocessableEntityException(err)
        }


    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Get('vendorIntentList')
    async vendorIntentManagementList(
        @Query('search') search: string,
        @Query('page') pageNo: string,
    ) {
        try {
            const page = (pageNo != undefined && pageNo != "" )? pageNo:"1";
            const vendorIntentList = await this.vendorsService.vendorIntentManagementList(search,+page)
            return this.common.makeSuccessResponse(vendorIntentList, 200)
        }
        catch (err) {
            throw new UnprocessableEntityException(err)
        }


    }
}
