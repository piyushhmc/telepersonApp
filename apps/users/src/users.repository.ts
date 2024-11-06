
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { User } from '@app/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

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

  async getUserId(guid: string) {
    try {
      const rawQuery = `SELECT id,firstName,lastName,email FROM user WHERE usrGuid = ?;`;
      const result = await this.getItemsRepository().query(rawQuery, [guid]);
      return result;
    } catch (error) {
      throw new Error(`Error executing raw query: ${error.message}`);
    }
  }
}

