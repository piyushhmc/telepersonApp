
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { Vendors } from './models/vendors.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class VendorRepository extends AbstractRepository<Vendors> {
  protected readonly logger = new Logger(VendorRepository.name);

  constructor(
    @InjectRepository(Vendors)
    itemsRepository: Repository<Vendors>,
    entityManager: EntityManager,
  ) {
    super(itemsRepository, entityManager);
  }

  async vendorList(search:string,page:number,sortBy:string,take:number){
   
    const skip = (page - 1) * take; // number of records to skip
    const builder = await this.getItemsRepository().createQueryBuilder('vendors');
    search = search?.trim()??"";
    

    if (search) {
      builder.where('vendors.companyName LIKE :search ', { search: `%${search}%` });
    }

    const order = sortBy.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const total = await builder.getCount()
    builder.orderBy(`vendors.id`,order)
           .skip(skip)
           .take(take);
    
    const vendorList =  await builder.getMany();

    return {
      vendorList,
      pageResult:{
        total,
        page,
        lastPage : Math.ceil(total/take)
      }
    }
  }
}

