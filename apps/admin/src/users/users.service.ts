import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { ConfigService } from '@nestjs/config';
import { PatchUserDto } from './dto/patch-user.dto';
import{RegisterUserDto} from './dto/registration.dto';
import { User } from '@app/common';
import * as bcrypt from 'bcryptjs';
import { Status ,UserRole} from  './models/user.interface'
import { PutUserDto } from './dto/put-user.dto';
import { Logger } from 'nestjs-pino';

@Injectable()
export class UsersService {

    constructor(
        private readonly userRepository: UsersRepository,
        private readonly configService: ConfigService,
        private readonly logger:Logger
    ){}

    async patchUser(id:number,loggedInUserId :number,patchUserDto: PatchUserDto) {
        const user = new User({})

        if (patchUserDto.status ==  Status.ACTIVE){
            user.status = Status.ACTIVE
        }
        
        if (patchUserDto.status ==  Status.INACTIVE){
            user.status = Status.INACTIVE
        }

        if (patchUserDto.status ==  Status.DELETED){
            user.status = Status.DELETED
            user.deletedBy = loggedInUserId
            user.deletedAt = new Date();

        }

        let isUpdate = await this.userRepository.findOneAndUpdate(
            { id },
            user,
        );
        
        if(isUpdate!=null && (patchUserDto.status ==  Status.DELETED)){
            this.deleteUserVendor(id)
        }
        return user
    }

    private async deleteUserVendor(userId:number){
        return this.userRepository.deleteUserVendor(userId)
    }

    async userList(search:string,page:number,orderBy:string){

        const take = this.configService.get('PAGE_SIZE')||25; // number of records to fetch per page
        return await this.userRepository.userList(search,page,orderBy,take)
    }

    async registerUser(registerUserDto:RegisterUserDto){
        
        try{
            
            const user = new User({})
            user.firstName = registerUserDto.firstName;
            user.lastName = registerUserDto.lastName;
            user.email = registerUserDto.email;
            user.status = Status.PENDING;
    
            if (registerUserDto.role == "Admin") {
                user.role = UserRole.ADMIN
            } else if (registerUserDto.role == "Agent") {
                user.role = UserRole.AGENT
            } else {
                this.logger.log(`Invalid user role!'`)
                throw  new UnprocessableEntityException('Invalid user role!')
            }
    
            user.password = await bcrypt.hash(registerUserDto.password, (+this.configService.get('SALT')||10))
    
            await this.checkEmailExists(registerUserDto.email);
           
            return await this.userRepository.create(user);
            
        }
        catch(err){
            this.logger.log(err)
            throw  new UnprocessableEntityException(err)
        }
        
        

    }

    private async checkEmailExists(email: string) {
        try {
          let isUser = await this.userRepository.findOne({ email: email });
          if(isUser){
            throw new UnprocessableEntityException('Email already exists');
          }
          return

        } catch (err) {
            this.logger.log(err.message)
          return;
        }
        
    }

    async userDetails(id:number){

        return await this.userRepository.findOne({ id: id })
        
    }

    async updateUser(id:number,putUserDto:PutUserDto){

       

        const user = new User({})
        user.firstName = putUserDto.firstName
        user.lastName = putUserDto.lastName
        user.mobile = putUserDto.mobile
        user.extension = putUserDto.extension
        user.facebook = putUserDto.facebook
        user.linkedin = putUserDto.linkedin
        user.twitter = putUserDto.twitter
        user.instagram = putUserDto.instagram

        if (putUserDto.status ==  Status.ACTIVE){
            user.status = Status.ACTIVE
        }
        
        if (putUserDto.status ==  Status.INACTIVE){
            user.status = Status.INACTIVE
        }

        if (putUserDto.status ==  Status.PENDING){
            user.status = Status.PENDING
        }

        if (putUserDto.role == "Admin") {
            user.role = UserRole.ADMIN
        } else if (putUserDto.role == "Agent") {
            user.role = UserRole.AGENT
        }else if (putUserDto.role == "User") {
            user.role = UserRole.USER
        }else {
            throw  new UnprocessableEntityException('Invalid user role!')
        }


        await this.userRepository.findOneAndUpdate(
            { id },
            user,
        );
    
        return user

    }
}

