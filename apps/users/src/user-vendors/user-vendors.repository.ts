
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { UserVendors } from './models/user-vendors.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class UserVenndorsRepository extends AbstractRepository<UserVendors> {
  protected readonly logger = new Logger(UserVenndorsRepository.name);

  constructor(
    @InjectRepository(UserVendors)
    itemsRepository: Repository<UserVendors>,
    entityManager: EntityManager,
  ) {
    super(itemsRepository, entityManager);
  }

  async removedUserVendorList(userId: number, page: number = 1, pageSize: number = 10) {

    const offset = (page - 1) * pageSize;

    const rawQuery = `SELECT uv.id as id,
    uv.isPlaidLinked as isPlaidLinked,
    uv.userId as userId,
    uv.vendorId as vendorId,
    uv.isActive as isActive,
    v.companyOverview,
    v.companyCode,
    v.industry,
    v.logoUrl,
    v.foundedYear,
    v.approvalStatus,
    v.companyName
    FROM user_vendors uv
    Left Join vendors v on uv.vendorId = v.id 
    WHERE uv.deletedAt IS   NULL 
    AND uv.isActive = 0 AND  
    uv.userId = ${userId} order by uv.id DESC  LIMIT ${pageSize}  OFFSET ${offset} ;`;

    try {
      const result = await this.getItemsRepository().query(rawQuery);
      return result;
    } catch (error) {
      throw new Error(`Error executing  query: ${error.message}`);
    }
  }

  async userVendorList(userId: number, page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const rawQuery = `SELECT uv.id as id,
    uv.isPlaidLinked as isPlaidLinked,
    uv.userId as userId,
    uv.vendorId as vendorId ,
    uv.isActive as isActive,
    v.companyOverview,
    v.companyCode,
    v.industry,
    v.logoUrl,
    v.foundedYear,
    v.approvalStatus,
    v.companyName,
    v.isMX
    FROM user_vendors uv
    Left Join vendors v on uv.vendorId = v.id 
    WHERE uv.deletedAt IS  NULL 
    AND uv.isActive = 1 AND  
    uv.userId = ${userId} order by uv.id DESC  LIMIT ${pageSize}  OFFSET ${offset} ;`;

    try {
      const result = await this.getItemsRepository().query(rawQuery);
      return result;
    } catch (error) {
      throw new Error(`Error executing  query: ${error.message}`);
    }

  }

  async getCommunityUserVendor(userIds: number[], userId: number) {

    const rawQuery = `SELECT uv.id as userVendorId,
    v.id as vendorId,
    v.companyName as vendorName,
    v.logoUrl  as vendorLogo ,
    u.id as userId,
    u.profileImage as profileImage,
    u.firstName,
    u.lastName
    FROM user_vendors uv
    Left Join vendors v on uv.vendorId = v.id 
    Left JOIN  user u on uv.userId =u.id
    WHERE userId IN (${userIds}) AND 
    vendorId IN (SELECT vendorId FROM user_vendors WHERE userId = ${userId}) 
    and uv.deletedAt IS  NULL  AND uv.isActive = 1 order by uv.id ASC;
    `;

    try {
      const result = await this.getItemsRepository().query(rawQuery);
      return result;
    } catch (error) {
      throw new Error(`Error executing raw query: ${error.message}`);
    }

  }

  async getCommunityUsersVendor(userId: number, page: number = 1, pageSize: number = 10) {

    const offset = (page - 1) * pageSize;
    const queryBuilder = await this.getItemsRepository().createQueryBuilder('user_vendors');

    const subQuery = queryBuilder
      .subQuery()
      .select('vendorId')
      .from('user_vendors', 'u')
      .where('u.userId = :userId', { userId })
      .getQuery();

    const commonUsers = await queryBuilder
      .select(['user_vendors.userId'])
      .where(`user_vendors.vendorId IN (${subQuery})`)
      .andWhere('user_vendors.userId <> :userId', { userId })
      .andWhere('user_vendors.deletedAt IS  NULL')
      .andWhere('user_vendors.isActive = 1')
      .groupBy('user_vendors.userId')
      .offset(offset)
      .limit(pageSize)
      .getMany();
    return commonUsers;

  }

  async getCommunityVendorBYUserId(userId: number, page: number = 1, pageSize: number = 10) {

    const offset = (page - 1) * pageSize;

    const rawQuery = `SELECT uv.id as userVendorId,
    v.id as vendorId,
    v.companyName as name,
    v.logoUrl  as logo ,
    u.id as userId,
    u.profileImage as profileImage,
    u.firstName,
    u.email,
    u.lastName,
    u.facebook,
    u.linkedin,
    u.twitter,
    u.instagram
    FROM user_vendors uv
    Left Join vendors v on uv.vendorId = v.id 
    Left JOIN  user u on uv.userId =u.id
    WHERE userId = ${userId} 
    AND uv.deletedAt IS  NULL  AND uv.isActive = 1 
    order by uv.id DESC  LIMIT ${pageSize}  OFFSET ${offset};`;

    try {
      const result = await this.getItemsRepository().query(rawQuery);
      return result;
    } catch (error) {
      throw new Error(`Error executing raw query: ${error.message}`);
    }
  }

  async listCommunityVendor(userId: number, page: number = 1, pageSize: number = 10) {

    const offset = (page - 1) * pageSize;

    const rawQuery = `SELECT uv.vendorId, v.companyName as name, v.logoUrl  as logo 
    FROM user_vendors uv
    left join vendors v  on uv.vendorId =v.id 
    WHERE userId = ${userId}
    AND vendorId IN (
        SELECT vendorId
        FROM user_vendors
        WHERE userId != ${userId}
    )
    
    LIMIT ${pageSize}  OFFSET ${offset};`

    try {
      const result = await this.getItemsRepository().query(rawQuery);
      return result;
    } catch (error) {
      throw new Error(`Error executing raw query: ${error.message}`);
    }

  }


  async findUserVendorsWithIds(userId: number, vendorId: number): Promise<UserVendors> {

    return this.getItemsRepository().createQueryBuilder('user_vendors')
      .where('user_vendors.userId = :userId', { userId })
      .andWhere('user_vendors.isActive = 0')
      .andWhere('user_vendors.deletedAt is not null')
      .andWhere('user_vendors.vendorId = :vendorId', { vendorId: vendorId })
      .getOne();
  }

  async upsertUserVendor(userVendor: UserVendors) {

    const userId = userVendor.userId;
    const vendorId = userVendor.vendorId

    try {
      userVendor.deletedAt = null
      userVendor.deletedBy = null
      await this.getItemsRepository().update({ userId, vendorId }, userVendor);
      return await this.getItemsRepository().find({ where: { userId, vendorId } });

    } catch (error) {
      throw new Error(`Error executing  query: ${error.message}`);
    }

  }

  async getCommunityUsers(userId: number) {

    try {
      const queryBuilder = await this.getItemsRepository().createQueryBuilder('user_vendors');

      const subQuery = queryBuilder
        .subQuery()
        .select('vendorId')
        .from('user_vendors', 'u')
        .where('u.userId = :userId', { userId })
        .getQuery();

      const commonUsers = await queryBuilder
        .select(['user_vendors.userId'])
        .where(`user_vendors.vendorId IN (${subQuery})`)
        .andWhere('user_vendors.userId <> :userId', { userId })
        .andWhere('user_vendors.deletedAt IS  NULL')
        .andWhere('user_vendors.isActive = 1')
        .groupBy('user_vendors.userId')
        .getMany();

      return commonUsers;
    }
    catch (err) {
      throw new Error(`Error executing  query: ${err.message}`);
    }
  }

  async getCommunityUserDetails(userIds: number[]) {

    const rawQuery = `SELECT id,profileImage FROM user  WHERE id  IN  (${userIds})  and deletedAt IS  NULL`;

    try {
      const result = await this.getItemsRepository().query(rawQuery);
      return result;
    } catch (error) {
      throw new Error(`Error executing  query: ${error.message}`);
    }
  }

}

