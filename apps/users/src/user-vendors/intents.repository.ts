
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Intents } from './models/intent.entity';

@Injectable()
export class IntentsRepository extends AbstractRepository<Intents> {
  protected readonly logger = new Logger(IntentsRepository.name);

  constructor(
    @InjectRepository(Intents)
    itemsRepository: Repository<Intents>,
    entityManager: EntityManager,
  ) {
    super(itemsRepository, entityManager);
  }
}

