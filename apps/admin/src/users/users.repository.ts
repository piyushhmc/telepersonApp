
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository,User } from '@app/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class UsersRepository extends AbstractRepository<User> {
  protected readonly logger = new Logger(UsersRepository.name);

  constructor(
    @InjectRepository(User)
    itemsRepository: Repository<User>,
    entityManager: EntityManager,
    
  ) {
    super(itemsRepository, entityManager);
  }

  async userList(search:string,page:number,sortBy:string,take:number){
   
    const skip = (page - 1) * take; // number of records to skip
    const builder = await this.getItemsRepository().createQueryBuilder('user');
    search = search?.trim()??"";
    

    if (search) {
      builder.where('user.firstName LIKE :search OR user.lastName LIKE :search OR user.email LIKE :search', { search: `%${search}%` });
    }

    const order = sortBy.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const total = await builder.getCount()
    builder.orderBy(`user.id`,order)
           .skip(skip)
           .take(take);
    
    const userList =  await builder.getMany();

    return {
      userList,
      pageResult:{
        total,
        page,
        lastPage : Math.ceil(total/take)
      }
    }
  }

  async deleteUserVendor(userId:number){
    const rawQuery = `Delete from user_vendors where userId=${userId}`;

    try {
      const result= await this.getItemsRepository().query(rawQuery);  
    } catch (error) {
      throw new Error(`Error executing  query: ${error.message}`);
    }
  }
}

