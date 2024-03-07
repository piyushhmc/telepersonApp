
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { Vendors } from './models/vendors.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class VenndorsRepository extends AbstractRepository<Vendors> {
  protected readonly logger = new Logger(VenndorsRepository.name);

  constructor(
    @InjectRepository(Vendors)
    itemsRepository: Repository<Vendors>,
    entityManager: EntityManager,
  ) {
    super(itemsRepository, entityManager);
  }

  async listPopularVendor() {
    return await  this.getItemsRepository().createQueryBuilder('vendors')
      .select(['vendors.industry', 'vendors.id', 'vendors.companyName', 'vendors.logoUrl'])
      .where('vendors.industry IS NOT NULL')
      .andWhere('vendors.isPopular = :isPopular', { isPopular: 1 })
      .groupBy('vendors.industry')
      .groupBy('vendors.companyName')
      .getRawMany();
  }

  async listVendors(search: string,searchBy: string){
    return this.getItemsRepository()
    .createQueryBuilder('vendors')
    .select([
      `vendors.id`,
      `vendors.companyName`,
      `vendors.companyCode`,
      `vendors.logoUrl`,
      `vendors.websiteURL` 
    ])
    .where(`vendors.${searchBy}  LIKE :keyword`, { keyword: `%${search}%` })
    .andWhere(`vendors.isCommunityVendor=:isCommunityVendor`,{isCommunityVendor:0})
    .getMany();
  }

  async listCommunityVendor() {
    return await  this.getItemsRepository().createQueryBuilder('vendors')
      .select(['vendors.industry', 'vendors.id', 'vendors.companyName', 'vendors.logoUrl','vendors.websiteURL'])
      .where('vendors.isCommunityVendor = :isCommunityVendor', { isCommunityVendor: 1 })
      .getRawMany();
  }
}

