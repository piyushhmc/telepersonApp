import { Body, Controller, Delete, Get, Param, Post, Put, Query, UnprocessableEntityException, 
    UploadedFile, UseGuards, UseInterceptors ,FileValidator,  HttpStatus,  ParseFilePipeBuilder,} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CurrentUser, JwtAuthGuard, Roles, User } from '@app/common';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { Common } from '../utils/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateOrUpdateVendorIntentDto } from './dto/createorupdatevendorintent.dto';
import { Logger } from 'nestjs-pino';

class MaxFileSize extends FileValidator<{ maxSize: number }>{
    constructor(options: { maxSize: number },
        ) {
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


@Controller()
export class VendorsController {
    constructor(
        private readonly vendorsService:VendorsService,
        private readonly logger:Logger,
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
    @Post('vendorIntent')
    createOrUpdateVendorIntent(
        @Body() createOrUpdateVendorIntent: CreateOrUpdateVendorIntentDto,
    ){
        try{            
            return this.vendorsService.createOrUpdateVendorIntent(createOrUpdateVendorIntent)
        }
        catch(err){
            throw new UnprocessableEntityException(err)
        }
       
    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Delete('vendorintent/:id')
    async deleteVendorIntent(
        @Param('id') id: string
    ){
        try{            
            const deleted = await this.vendorsService.deleteVendorIntent(id)
            console.log(deleted)
            if(deleted.affected > 0){
                let response ={
                    status:200,
                    message:"intent is deleted"
                }
                return response
            }else{
                let response = {
                    status:404,
                    message:"intent is not found"
                }
                return response
            }
            return
        }
        catch(err){            
            this.logger.log(err)
            throw new UnprocessableEntityException(err)
        }
    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Delete('deleteVendor/:id')
    deleteVendor(
        @Param('id') id: string,
        @CurrentUser() user: User,
    ){
        try{                        
             this.vendorsService.deleteVendor(+id,user.id)
             let response = {
                status:200,
                message:"vendor deleted sucessfully."
            }
            return response
        }
        catch(err){
            this.logger.log(err)
            throw new UnprocessableEntityException(err)
        }
    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Get('vendorintent/:id')
    getVendorIntent(
        @Param('id') id: number
    ){
        try{            
            return this.vendorsService.getVendorIntent(id)
        }
        catch(err){
            this.logger.log(err)
            throw new UnprocessableEntityException(err)
        }
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
            this.logger.log(err)
            throw new UnprocessableEntityException(err)
        }
        
    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Get('vendorintents/:id')
    async vendorIntentsList(
        @Query('search') search: string,
        @Query('page') pageNo: string,
        @Query('page') pageSize: string,
        @Param('id') id: number
    ) {
        try {
            const page = (pageNo != undefined && pageNo != "" )? pageNo:"1";
           return await this.vendorsService.vendorIntentsListbyVendorId(id,search, +page,+pageSize)

        }
        catch (err) {
            this.logger.log(err)
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
        @Query('status') status: string,
    ) {

        try {
            const page = (pageNo != undefined && pageNo != "" )? pageNo:"1";
            const sort = (orderBy != undefined && orderBy != "" )? orderBy:"desc";
            const vendorList = await this.vendorsService.vendorList(search, +page, sort,status)

            return this.common.makeSuccessResponse(vendorList, 200)
        }
        catch (err) {
            this.logger.log(err)
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
            this.logger.log(err)
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
            this.logger.log(err)
            throw new UnprocessableEntityException(err)
        }
    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Get('vendorIntentList')
    async vendorIntentManagementList(
        @Query('search') search: string,
        @Query('page') pageNo: string,
        @Query('orderBy') orderBy: string,
        @Query('orderByColumn') orderByColumn: string,
    ) {
        try {
            console.log("orderBy-----",orderBy)
            const page = (pageNo != undefined && pageNo != "" )? pageNo:"1";
            const sort = (orderBy != undefined && orderBy != "" )? orderBy:"desc";
            const sortOnColumn = orderByColumn ? orderByColumn : 'companyName'
            const vendorIntentList = await this.vendorsService.vendorIntentManagementList(search,+page,sort,sortOnColumn)
            return this.common.makeSuccessResponse(vendorIntentList, 200)
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err)
        }
    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Get('subscribeVendorIntentList')
    async subscribeVendorIntentManagementList(
        @Query('search') search: string,
        @Query('page') pageNo: string,
        @Query('orderBy') orderBy: string,
        @Query('orderByColumn') orderByColumn: string,
    ) {
        try {
            const page = (pageNo != undefined && pageNo != "" )? pageNo:"1";
            const sort = (orderBy != undefined && orderBy != "" )? orderBy:"desc";
            const sortOnColumn = orderByColumn ? orderByColumn : 'companyName'
            const vendorIntentList = await this.vendorsService.subscribevendorIntentManagementList(search,+page,sort,sortOnColumn)
            return this.common.makeSuccessResponse(vendorIntentList, 200)
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err)
        }
    }


    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('avatar'))
    @Post('vendor-upload-image/:id')
    addVendorProfileImage(
      @UploadedFile(
        new ParseFilePipeBuilder()
          .addFileTypeValidator({
            fileType: /(jpg|jpeg|png)$/,
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
      @Param('id') id: number
    ) { 
      return this.vendorsService.addVendorProfileImage(id, file);
    }

}
