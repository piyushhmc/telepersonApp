
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { ForgotPassword } from './models/user-forgot-password.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class UsersForgotPaswordRepository extends AbstractRepository<ForgotPassword> {
  protected readonly logger = new Logger(UsersForgotPaswordRepository.name);

  constructor(
    @InjectRepository(ForgotPassword)
    itemsRepository: Repository<ForgotPassword>,
    entityManager: EntityManager,
  ) {
    super(itemsRepository, entityManager);
  }

  async resetPasswordValidateQuery(alias:string,selectField:any,email:string,token:string){
    return this.getItemsRepository()
    .createQueryBuilder(alias)
    .select(selectField)
    .where(`${alias}.expiryDate >= :expiryDate`, { expiryDate: new Date() })
    .andWhere(`${alias}.email = :email`, { email: email })
    .andWhere(`${alias}.token = :token`, { token: token })
    .getOne();
  }
}

