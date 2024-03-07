
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { UserReferal } from './models/userreferal.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class UsersReferalRepository extends AbstractRepository<UserReferal> {
  protected readonly logger = new Logger(UsersReferalRepository.name);

  constructor(
    @InjectRepository(UserReferal)
    itemsRepository: Repository<UserReferal>,
    entityManager: EntityManager,
  ) {
    super(itemsRepository, entityManager);
  }

  async findReferal(email: string, referalCode: string) {
    return this.getItemsRepository()
    .createQueryBuilder('user_referal')
    .select('user_referal.id')
    .where(`user_referal.email = :email`, { email: email })
    .andWhere(`user_referal.referalCode = :referalCode`, { referalCode: referalCode })
    .getOne();
  } 
}

