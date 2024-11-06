import {
    Body, Controller, Get, Param, Patch, Post, Put, Query, Headers,
    UnprocessableEntityException, UploadedFile, UseGuards, UseInterceptors, BadRequestException, NotFoundException
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
import { CreateMXUserDto } from './dto/create-mx-user.dto';
import { CompanyRatingDto } from './dto/company-rating.dto';
import { TelepersonRatingDto } from './dto/teleperson-rating';

@Controller('users/user-vendors')
export class UserVendorsController {
    constructor(
        private readonly userVendorsService: UserVendorsService,
        private readonly common: Common
    ) { }

    @Roles('User', 'Admin')
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

    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Get()
    async listUserVendorMap(@CurrentUser() user: User, @Query('page') pageNo: string, @Query('isActive') isActive: string) {

        const page = (pageNo != undefined && pageNo != "") ? pageNo : "1";

        try {
            const mappedVendor = await this.userVendorsService.listUserVendorMap(user.id, +page, 50)
            return this.common.makeSuccessResponse(mappedVendor, 200)
        } catch (err) {
            throw new UnprocessableEntityException(err)
        }

    }

    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Patch()
    patchUserVendorMap(
        @CurrentUser() user: User,
        @Body() patchUserVenndorsDto: PatchUserVenndorsDto
    ) {
        return this.userVendorsService.patchUserVendorMap(user.id, patchUserVenndorsDto)
    }

    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Get('vendors')
    async listVendors(@Query('search') search: string, @Headers('host') hostHeader: string) {

        try {
            console.log('Host Header:', hostHeader);
            const listVendor = await this.userVendorsService.listVendors(search)
            return this.common.makeSuccessResponse(listVendor, 200)
        }
        catch (err) {
            throw new UnprocessableEntityException(err)
        }
    }

    @Roles('User', 'Admin')
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

    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Post('addVendor')
    async addVendor(@Body() createVendorDto: CreateVendorDto,
        @CurrentUser() user: User) {
        try {
            return this.userVendorsService.addVendorByUser(user.id, createVendorDto)
        }
        catch (err) {
            throw new UnprocessableEntityException(err)
        }
    }

    @Roles('User', 'Admin')
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

    @Roles('User', 'Admin')
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

    @Roles('User', 'Admin')
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

    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Get('vendor-users-list/:id')
    async vendorUserList(
        @Param('id') id: string,
        @CurrentUser() user: User
    ) {
        try {
            const vendorsUers = await this.userVendorsService.vendorUserList(+id, user.id)
            return this.common.makeSuccessResponse(vendorsUers, 200)
        }
        catch (err) {
            throw new UnprocessableEntityException(err)
        }
    }


    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Put()
    removeUserVendorMap(
        @CurrentUser() user: User,
        @Body() removeUserVenndorsDto: RemoveUserVenndorsDto
    ) {
        return this.userVendorsService.removeUserVendorMap(user.id, removeUserVenndorsDto)
    }

    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Get('removed-vendors')
    async removeUserVendorList(
        @CurrentUser() user: User,
        @Query('page') pageNo: string

    ) {
        try {
            const page = (pageNo != undefined && pageNo != "") ? pageNo : "1";
            const removedVendorList = await this.userVendorsService.removeUserVendorList(user.id, +page, 50)
            return this.common.makeSuccessResponse(removedVendorList, 200)
        } catch (err) {
            throw new UnprocessableEntityException(err)
        }

    }

    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Get('communityVendors/:id')
    async communityVendorList(
        @CurrentUser() user: User,
        @Query('page') pageNo: string,
        @Param('id') id: string,

    ) {
        try {
            const page = (pageNo != undefined && pageNo != "") ? pageNo : "1";
            const communityVendorList = await this.userVendorsService.communityVendorList(+id, +page, 50)
            return this.common.makeSuccessResponse(communityVendorList, 200)
        } catch (err) {
            throw new UnprocessableEntityException(err)
        }

    }

    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Get('all-community-vendors')
    async allCommunityVendorList(
        @CurrentUser() user: User,
        @Query('page') pageNo: string,

    ) {
        try {
            const page = (pageNo != undefined && pageNo != "") ? pageNo : "1";
            const allCommunityVendorList = await this.userVendorsService.allCommunityVendorList(user.id, +page, 50)
            return this.common.makeSuccessResponse(allCommunityVendorList, 200)
        } catch (err) {
            throw new UnprocessableEntityException(err)
        }

    }

    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Get('community-vendors/:id')
    async getCommunityVendorBYUserId(
        @Param('id') id: string,
        @Query('page') pageNo: string,

    ) {
        try {
            const page = (pageNo != undefined && pageNo != "") ? pageNo : "1";
            const communityVendorList = await this.userVendorsService.getCommunityVendorBYUserId(+id, +page, 50)
            return this.common.makeSuccessResponse(communityVendorList, 200)
        } catch (err) {
            throw new UnprocessableEntityException(err)
        }

    }

    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Get('list-community-vendors')
    async listCommunityVendorBYUserId(
        @CurrentUser() user: User,
        @Query('page') pageNo: string,

    ) {
        try {
            const page = (pageNo != undefined && pageNo != "") ? pageNo : "1";
            const communityVendorList = await this.userVendorsService.listCommunityVendor(user.id, +page, 50)
            return this.common.makeSuccessResponse(communityVendorList, 200)
        } catch (err) {
            throw new UnprocessableEntityException(err)
        }

    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Get('mx-vendors')
    async listMXVendor(
        @CurrentUser() user: User,
        @Query('search') search: string,

    ) {
        try {

            const communityVendorList = await this.userVendorsService.getVendorFromMX(search)
            return this.common.makeSuccessResponse(communityVendorList, 200)
        } catch (err) {
            throw new UnprocessableEntityException(err)
        }

    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Get('vendor-script')
    async updateVendorLogo() {
        await this.userVendorsService.UpdateVendoScript()

        return true
    }

    @Roles('Admin', 'User')
    @UseGuards(JwtAuthGuard)
    @Get('mx-user')
    async getMXVendor(
        @CurrentUser() user: User,
        @Query('email') search: string,

    ) {
        try {

            const mxUsers = await this.userVendorsService.getMXUsers(search)
            return this.common.makeSuccessResponse(mxUsers, 200)
        } catch (err) {
            throw new UnprocessableEntityException(err)
        }

    }

    @Roles('Admin', 'User')
    @UseGuards(JwtAuthGuard)
    @Get('mx-user-transctions')
    async getMXUsersTransction(
        @CurrentUser() user: User,
        @Query('guid') search: string,
        @Query('fromdate') fromdate: string,
        @Query('toDate') toDate: string,

    ) {
        try {

            const mxUsers = await this.userVendorsService.getMXUsersTransction(search, fromdate, toDate)
            return this.common.makeSuccessResponse(mxUsers, 200)
        } catch (err) {
            throw new NotFoundException(err.message)
        }

    }

    @Roles('Admin', 'User')
    @UseGuards(JwtAuthGuard)
    @Get('mx-widget-url')
    async getRequestwidgetURL(
        @CurrentUser() user: User,
        @Query('guid') userGuid: string,

    ) {
        try {
            const mxUsers = await this.userVendorsService.requestwidgetURL(userGuid)
            return this.common.makeSuccessResponse(mxUsers, 200)
        } catch (err) {
            throw new NotFoundException(err.message)
        }

    }

    @Roles('Admin', 'User')
    @UseGuards(JwtAuthGuard)
    @Post('create-mx-user')
    async createMXUser(@Body() createMXUserDto: CreateMXUserDto) {
        try {
            const mxUsers = await this.userVendorsService.createMXUser(createMXUserDto)
            return this.common.makeSuccessResponse(mxUsers, 200)
        } catch (err) {
            throw new BadRequestException(err.message)
        }

    }

    @Roles('Admin', 'User')
    @UseGuards(JwtAuthGuard)
    @Post('company-rating')
    async addOrUpdateCompanyRating(@CurrentUser() user: User, @Body() companyRatingDto: CompanyRatingDto) {

        try {
            const result = await this.userVendorsService.addOrUpdateCompanyRating(companyRatingDto, user)
            return this.common.makeSuccessResponse(result, 200)
        } catch (err) {
            throw new BadRequestException(err.message)
        }

    }

    @Roles('Admin', 'User')
    @UseGuards(JwtAuthGuard)
    @Post('teleperson-rating')
    async addOrUpdateTelepersonRating(@CurrentUser() user: User, @Body() telepersonRatingDto: TelepersonRatingDto) {

        try {
            const result = await this.userVendorsService.addOrUpdateTelepersonRating(telepersonRatingDto, user)
            return this.common.makeSuccessResponse(result, 200)
        } catch (err) {
            throw new BadRequestException(err.message)
        }

    }

    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Get('company-rating/:id')
    async getCompanyRatingBYVendorId(
        @Param('id') id: string,

    ) {
        try {

            const rating = await this.userVendorsService.getCompanyRatingBYVendorId(+id)
            return this.common.makeSuccessResponse(rating, 200)
        } catch (err) {
            throw new UnprocessableEntityException(err)
        }

    }

    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Get('teleperson-rating/:id')
    async getTelepersonRatingBYVendorId(
        @Param('id') id: string,

    ) {
        try {

            const rating = await this.userVendorsService.getTelepersonRatingBYVendorId(+id)
            return this.common.makeSuccessResponse(rating, 200)
        } catch (err) {
            throw new UnprocessableEntityException(err)
        }

    }

    @Post('csvUpload')
    @UseInterceptors(FileInterceptor('filename', { dest: './uploads' }))
    async uploadFile(@UploadedFile() files: Express.Multer.File) {
        console.log("files====>", files);
        //   //readAndInsertData
        await this.userVendorsService.updateMasterVendorData(files.path);

        return { message: 'Data inserted successfully' };
    }

    @Post('intentCSVUpload')
    @UseInterceptors(FileInterceptor('filename', { dest: './uploads' }))
    async uploadFile1(@UploadedFile() files: Express.Multer.File) {
        console.log("files====>", files);
        //   //readAndInsertData
        await this.userVendorsService.updateVendorIntentData(files.path);

        return { message: 'Data inserted successfully' };
    }


    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Get('top-vendors')
    async getTopVendors(@CurrentUser() user: User) {
        try {
            const rating = await this.userVendorsService.getTopVendors(user.id)
            return this.common.makeSuccessResponse(rating, 200)
        } catch (err) {
            throw new UnprocessableEntityException(err)
        }

    }





}
