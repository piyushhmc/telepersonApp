import { CurrentUser, JwtAuthGuard, Roles, User } from '@app/common';
import { Body, Controller, Get, Param, Patch, Post, Put, Query, UnprocessableEntityException, UseGuards } from '@nestjs/common';
import { PatchUserDto } from './dto/patch-user.dto';
import { UsersService } from './users.service';
import { string } from 'joi';
import { Common } from '../utils/common';
import { RegisterUserDto } from './dto/registration.dto';
import { PutUserDto } from './dto/put-user.dto';
import { Logger } from 'nestjs-pino';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService,
        private readonly common: Common,
        private readonly logger: Logger
    ) { }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    patchUser(
        @CurrentUser() user: User,
        @Body() patchUserDto: PatchUserDto,
        @Param('id') id: string

    ) {
        
        return this.userService.patchUser(+id,user.id, patchUserDto)
    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Get()
    async userList(
        @Query('search') search: string,
        @Query('page') pageNo: string,
        @Query('orderBy') orderBy: string,
    ) {

        try {
            const page = (pageNo != undefined && pageNo != "" )? pageNo:"1";
            const sort = (orderBy != undefined && orderBy != "" )? orderBy:"desc";
            const userList = await this.userService.userList(search, +page, sort)

            return this.common.makeSuccessResponse(userList, 200)
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err)
        }


    }

    @Post()
    async registerUser(@Body() registerUserDto:RegisterUserDto) {

        try {
            const regUser = await this.userService.registerUser(registerUserDto)
            return this.common.makeSuccessResponse(regUser, 200)
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err)
        }


    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async userDetails(@Param('id') id: string) {

        try {
           
            const userList = await this.userService.userDetails(+id)

            return this.common.makeSuccessResponse(userList, 200)
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err)
        }


    }

    @Roles('Admin')
    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async updateUser(

        @Body() putUserDto: PutUserDto,
        @Param('id') id: string
    ){
        return this.userService.updateUser(+id, putUserDto)
    }

}
