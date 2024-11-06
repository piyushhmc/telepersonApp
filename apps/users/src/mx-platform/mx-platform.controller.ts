import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Post,
    UnprocessableEntityException,
    UseGuards,
    forwardRef,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { Configuration, MxPlatformApi } from 'mx-platform-node';
import { CurrentUser, JwtAuthGuard, Roles, User } from '@app/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersRepository } from '../users.repository';
import { Repository } from 'typeorm';
import { UsersService } from '../users.service';
import { MxConnectWidgetDTO } from '../dto/mx-connect-widget.dto';


@Controller('users')
export class MXPlatformController {
    private client;
    constructor(
        private readonly logger: Logger,
        private readonly configService: ConfigService,
        @InjectRepository(User)
        private readonly userRepository: Repository<UsersRepository>,
        @Inject(forwardRef(() => UsersService))
        private readonly userser: UsersService
    ) {


        const configuration = new Configuration({
            // Configure with your Client ID/API Key from https://dashboard.mx.com
            username: "e9268471-7298-49ff-a746-30fe281304aa",
            password: "1c29b11a048a3fb058c634a0ea7ad26488c827ed",
            // password: "4fb8f13489acd54b3293f91590a15798af9d9767",

            // Configure environment. https://int-api.mx.com for development, https://api.mx.com for production
            basePath: 'https://api.mx.com',
            // basePath: 'https://int-api.mx.com',

            baseOptions: {
                headers: {
                    Accept: 'application/vnd.mx.api.v1+json'
                }
            }
        })

        this.client = new MxPlatformApi(configuration)

    }

    @Get('api/users')
    async listUsers() {
        try {
            const listUsersResponse = await this.client.listUsers()
            return (listUsersResponse.data)
        }
        catch (err) {
            this.logger.log(err)
            throw new UnprocessableEntityException(err)
        }
    }

    // in use
    @Roles('User', 'Admin')
    @UseGuards(JwtAuthGuard)
    @Post('get-mxconnect-widget-url')
    async get_mxconnect_widget_url(
        @Body() MxConnectWidgetDTO: MxConnectWidgetDTO,
        @CurrentUser() user: User,

    ) {
        try {
            let userGuid = MxConnectWidgetDTO.userGuid
           
            if (user.id == null) {
                const createUserRequestBody = {
                    user: {
                        id: user.id ? user.id : null
                    }
                }
                const createUserResponse = await this.client.createUser(createUserRequestBody)
                userGuid = createUserResponse.data.user.guid

                // save userguid in user table
                await this.userRepository.createQueryBuilder()
                    .update(User)
                    .set({ usrGuid: userGuid })
                    .where({ id: user.id })
                    .execute();
            }
            const widgetRequestBody = {
                widget_url: {
                    include_transactions: true,
                    is_mobile_webview: false,
                    mode: 'verification',
                    ui_message_version: 4,
                    widget_type: 'connect_widget'
                }
            }

            const widgetResponse = await this.client.requestWidgetURL(userGuid, widgetRequestBody)
            let wURL = widgetResponse?.data?.widget_url?.url
            return {
                "data": [
                    { "url": wURL }
                ]
            }
        } catch (e) {
            this.logger.log(e)
            throw new Error(e)
        }
    }

    // in use
    // @Get('/transction/:userGuid/members/:memberGuid/transactions')
    // async listTransactionsByMember(userId: number, userGuid: string,memberGuid: string,page:number) {
    //     try {
    //         let fromdate = await this.getFromdate()
    //         const listTransactionsResponse = await this.client.listTransactionsByMember(memberGuid, userGuid,fromdate,page,100)
    //         await this.saveTransactionData(listTransactionsResponse.data, userId,userGuid,memberGuid)
    //         let result = listTransactionsResponse.data
    //         let totalPage = 0 
    //         totalPage = result?.pagination?.total_pages;
    //         // return result


    //         if(page < totalPage ){

    //             page++
    //             const listTransactionsResponse = await this.client.listTransactionsByMember(memberGuid, userGuid,fromdate,page,100)
    //             await this.saveTransactionData(listTransactionsResponse.data, userId,userGuid,memberGuid)

    //         }
    //     }
    //     catch (err) {
    //         this.logger.log(err)
    //         throw new Error(err)
    //     }
    // }

    async listTransactionsByMember(userId: number,name:string,email:string, userGuid: string, memberGuid: string, page: number) {
        try {
            let fromdate = await this.getFromdate();
            let totalPage  = 0;
            let totalCount = 0;
            let count = 0;
            do {
                const listTransactionsResponse = await this.client.listTransactionsByMember(memberGuid, userGuid, fromdate, page, 100);
                totalCount = await this.saveTransactionData(listTransactionsResponse.data, userId,totalCount);
                totalPage = listTransactionsResponse.data.pagination.total_pages;
                page++;
                count = listTransactionsResponse.data.pagination.total_entries;
            } while (page <= totalPage);
            
            let env =  this.configService.get<string>("ENV")
            if (env != "dev"){
                await this.userser.sendMXHooksEmail(name,email,userGuid,memberGuid,count)
            }
        }
        catch (err) {
            this.logger.log(err);
            throw new Error(err);
        }
    }

    async getFromdate() {
        // Get today's date
        let today = new Date();

        // Get the month from six months ago
        let sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);

        // Format the dates to 'YYYY-MM-DD'
        let todayFormatted = today.toISOString().split('T')[0];
        let sixMonthsAgoFormatted = sixMonthsAgo.toISOString().split('T')[0];

        return sixMonthsAgoFormatted

        // console.log("Today's Date: ", todayFormatted);
        // console.log("Date Six Months Ago: ", sixMonthsAgoFormatted);

    }

    async saveTransactionData(transactiondata: any, userId: number,totalCount:number) {
        if (transactiondata?.pagination?.total_entries > 0) {
            const tData = transactiondata.transactions
            const length = tData?.length||0 
            for (let i = 0; i < length; i++) {
                totalCount++
                await this.userser.insertMXUserTransctionDatabyMX(userId, tData[i], totalCount,length)
                
            }
            return  totalCount
        }
    }

    @Get('/users/:userGuid/members/:memberGuid/check_balance')
    async checkBalnace(@Param('userGuid') userGuid: string) {
        try {
            const listUserAccountsResponse = await this.client.listUserAccounts(userGuid)
            return listUserAccountsResponse.data
        }
        catch (err) {
            this.logger.log(err)
            throw new Error(err)
        }
    }

    @Post('/users/:userGuid/members/:memberGuid/check_balance')
    async checkBalances(
        @Param('userGuid') userGuid: string,
        @Param('memberGuid') memberGuid: string,
    ) {
        try {
            const balancesResponse = await this.client.checkBalances(memberGuid, userGuid)
            return balancesResponse.data
        } catch (e) {
            this.logger.log(e)
            throw new Error(e)
        }
    }

    @Get('/users/:userGuid/members/:memberGuid/status')
    async readMemberStatus(@Param('userGuid') userGuid: string,
        @Param('memberGuid') memberGuid: string,) {
        try {
            const statusResponse = await this.client.readMemberStatus(memberGuid, userGuid)
            return statusResponse.data
        }
        catch (err) {
            this.logger.log(err)
            throw new Error(err)
        }
    }

    @Get('/users/:userGuid/members/:memberGuid/verify')
    async listAccountNumbersByMember(@Param('userGuid') userGuid: string,
        @Param('memberGuid') memberGuid: string,) {
        try {
            const listAccountNumbersResponse = await this.client.listAccountNumbersByMember(memberGuid, userGuid)
            return listAccountNumbersResponse.data
        }
        catch (err) {
            this.logger.log(err)
            throw new Error(err)
        }
    }

    @Get('/users/:userGuid/members/:memberGuid/identify')
    async listAccountOwnersByMember(@Param('userGuid') userGuid: string,
        @Param('memberGuid') memberGuid: string,) {
        try {
            const listAccountOwnersResponse = await this.client.listAccountOwnersByMember(memberGuid, userGuid)
            return listAccountOwnersResponse.data
        }
        catch (err) {
            this.logger.log(err)
            throw new Error(err)
        }
    }


    @Post('/users/:userGuid/members/:memberGuid/identify')
    async identifyMember(
        @Param('userGuid') userGuid: string,
        @Param('memberGuid') memberGuid: string,
    ) {
        try {
            const identifyMemberResponse = await this.client.identifyMember(memberGuid, userGuid)
            return identifyMemberResponse.data
        } catch (e) {
            this.logger.log(e)
            throw new Error(e)
        }
    }


    @Delete('api/user/:userGuid')
    async deleteUser(
        @Param('userGuid') userGuid: string
    ) {
        try {
            await this.client.deleteUser(userGuid)
            return { user_guid: userGuid }
        }
        catch (err) {
            this.logger.log(err)
            throw new Error(err)
        }
    }
}
