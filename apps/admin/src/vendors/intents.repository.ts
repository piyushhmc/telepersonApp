
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Intents } from './models/intent.entity';

@Injectable()
export class IntentRepository extends AbstractRepository<Intents> {
  protected readonly logger = new Logger(IntentRepository.name);

  constructor(
    @InjectRepository(Intents)
    itemsRepository: Repository<Intents>,
    entityManager: EntityManager,
  ) {
    super(itemsRepository, entityManager);
  }

  async intentList(search:string,page:number,sortBy:string,take:number){
   
    console.log("inside intent repo")
    const skip = (page - 1) * take; // number of records to skip
    const builder = await this.getItemsRepository().createQueryBuilder('intents');
    search = search?.trim()??"";
    

    if (search) {
      builder.where('intents.intentName LIKE :search ', { search: `%${search}%` });
    }

    const order = sortBy.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const total = await builder.getCount()
    builder.orderBy(`intents.id`,order)
           .skip(skip)
           .take(take);
    
    const intentsList =  await builder.getMany();

    return {
      intentsList,
      pageResult:{
        total,
        page,
        lastPage : Math.ceil(total/take)
      }
    }
  }
}

