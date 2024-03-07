import {
    Body, Controller, Get, Param, Patch, Post, Put, Query,Headers,
    UnprocessableEntityException, UploadedFile, UseGuards, UseInterceptors
} from '@nestjs/common';
import { UserVendorsService } from './user-vendors.service';
import { CurrentUser, JwtAuthGuard, Roles, User } from '@app/common';
import { CreateUserVenndorsDto } from './dto/create-user-vendors.dto';
import { PatchUserVenndorsDto } from './dto/patch-user-vendors.dto';
import { Common } from '../utils/common';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import { RemoveUserVenndorsDto } from './dto/remove-user-vendors.dto';

import { Express } from 'express';

@Controller('users/user-vendors')
export class UserVendorsController {
    constructor(
        private readonly userVendorsService: UserVendorsService,
        private readonly common: Common
    ) { }

    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Post()
    async createUserVendorMap(
        @Body() createUserVenndorsDto: CreateUserVenndorsDto,
        @CurrentUser() user: User
    ) {
        try {
            return await this.userVendorsService.createUserVendorMap(user.id, createUserVenndorsDto)
        }
        catch (err) {
            throw new UnprocessableEntityException(err);
        }

    }

    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Get()
    async listUserVendorMap(@CurrentUser() user: User, @Query('page') pageNo: string,@Query('isActive') isActive: string) {
        
        const page = (pageNo != undefined && pageNo != "" )? pageNo:"1";

        try {
            const mappedVendor = await this.userVendorsService.listUserVendorMap(user.id,+page,10)
            return this.common.makeSuccessResponse(mappedVendor, 200)
        } catch (err) {
            throw new UnprocessableEntityException(err)
        }

    }

    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Patch()
    patchUserVendorMap(
        @CurrentUser() user: User,
        @Body() patchUserVenndorsDto: PatchUserVenndorsDto
    ) {
        return this.userVendorsService.patchUserVendorMap(user.id, patchUserVenndorsDto)
    }

    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Get('vendors')
    async listVendors(@Query('search') search: string,@Headers('host') hostHeader: string) {

        try {
            console.log('Host Header:', hostHeader);
            const listVendor = await this.userVendorsService.listVendors(search)
            return this.common.makeSuccessResponse(listVendor, 200)
        }
        catch (err) {
            throw new UnprocessableEntityException(err)
        }
    }

    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Get('vendors/:id')
    async vendorsDetails(@Param('id') id: string) {
        try {
            const vendordetails = await this.userVendorsService.vendorDetails(+id)
            return this.common.makeSuccessResponse(vendordetails, 200)
        }
        catch (err) {
            throw new UnprocessableEntityException(err)
        }

    }

    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Post('addVendor')
    async addVebdor(@Body() createVendorDto: CreateVendorDto,
        @CurrentUser() user: User) {
        try {
            return this.userVendorsService.addVendorByUser(user.id, createVendorDto)
        }
        catch (err) {
            throw new UnprocessableEntityException(err)
        }
    }

    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Get('vendor-intent/:id')
    async vendorIntent(@Param('id') id: string) {
        try {
            const vendorIntents = await this.userVendorsService.vendorIntent(+id)

            return this.common.makeSuccessResponse(vendorIntents, 200)
        }
        catch (err) {
            throw new UnprocessableEntityException(err)
        }
    }

    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Get('popular-vendors')
    async popularVendor() {
        try {
            const popularVendor = await this.userVendorsService.popularVendor()

            return this.common.makeSuccessResponse(popularVendor, 200)
        }
        catch (err) {
            throw new UnprocessableEntityException(err)
        }
    }

    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Get('community-users-list')
    async communityUserList(
        @CurrentUser() user: User,
    ) {
        try {
            const communityUsers = await this.userVendorsService.communityUserList(user.id)
            return this.common.makeSuccessResponse(communityUsers, 200)
        }
        catch (err) {
            throw new UnprocessableEntityException(err)
        }
    }


    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Put()
    removeUserVendorMap(
        @CurrentUser() user: User,
        @Body() removeUserVenndorsDto: RemoveUserVenndorsDto
    ) {
        return this.userVendorsService.removeUserVendorMap(user.id,removeUserVenndorsDto)
    }

    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Get('removed-vendors')
   async  removeUserVendorList(
        @CurrentUser() user: User,
        @Query('page') pageNo: string
        
    ) {
        try{
            const page = (pageNo != undefined && pageNo != "" )? pageNo:"1";
            const removedVendorList = await this.userVendorsService.removeUserVendorList(user.id,+page,10)
            return this.common.makeSuccessResponse(removedVendorList, 200)
        }catch(err){
            throw new UnprocessableEntityException(err)
        }
        
    }

    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Get('community-vendors')
   async  communityVendorList(
        @CurrentUser() user: User,
        @Query('page') pageNo: string,
        
    ) {
        try{
            const page = (pageNo != undefined && pageNo != "" )? pageNo:"1";
            const communityVendorList = await this.userVendorsService.communityVendorList(user.id,+page,10)
            return this.common.makeSuccessResponse(communityVendorList, 200)
        }catch(err){
            throw new UnprocessableEntityException(err)
        }
        
    }

    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Get('community-vendors/:id')
   async  getCommunityVendorBYUserId(
        @Param('id') id: string,
        @Query('page') pageNo: string,
        
    ) {
        try{
            const page = (pageNo != undefined && pageNo != "" )? pageNo:"1";
            const communityVendorList = await this.userVendorsService.getCommunityVendorBYUserId(+id,+page,10)
            return this.common.makeSuccessResponse(communityVendorList, 200)
        }catch(err){
            throw new UnprocessableEntityException(err)
        }
        
    }

    @Roles('User','Admin')
    @UseGuards(JwtAuthGuard)
    @Get('list-community-vendors')
   async  listCommunityVendorBYUserId(
    @CurrentUser() user: User,
    @Query('page') pageNo: string,
    
) {
    try{
        const page = (pageNo != undefined && pageNo != "" )? pageNo:"1";
        const communityVendorList = await this.userVendorsService.listCommunityVendor(user.id,+page,10)
        return this.common.makeSuccessResponse(communityVendorList, 200)
    }catch(err){
        throw new UnprocessableEntityException(err)
    }
    
}

    // @Post('csvUpload')
    // @UseInterceptors(FileInterceptor('filename', { dest: './uploads' }))
    // async uploadFile(@UploadedFile() files: Express.Multer.File) {
    //   console.log("files====>",files);
    //   //readAndInsertData
    //   await this.userVendorsService.updateMasterVendorData(files.path);

    // return { message: 'Data inserted successfully' }; 
    // }



}
