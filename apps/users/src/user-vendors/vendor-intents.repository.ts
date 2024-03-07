
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { VendorIntents } from './models/vendor-intent.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class VenndorIntentsRepository extends AbstractRepository<VendorIntents> {
  protected readonly logger = new Logger(VenndorIntentsRepository.name);

  constructor(
    @InjectRepository(VendorIntents)
    itemsRepository: Repository<VendorIntents>,
    entityManager: EntityManager,
  ) {
    super(itemsRepository, entityManager);
  }
}

