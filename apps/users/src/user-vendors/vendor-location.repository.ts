
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { VendorLocation } from './models/vendor-location.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class VenndorLocationRepository extends AbstractRepository<VendorLocation> {
  protected readonly logger = new Logger(VenndorLocationRepository.name);

  constructor(
    @InjectRepository(VendorLocation)
    itemsRepository: Repository<VendorLocation>,
    entityManager: EntityManager,
  ) {
    super(itemsRepository, entityManager);
  }

}

