
import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { MXUserTransction } from './models/mx-user-transction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class MXUserTransctionRepository extends AbstractRepository<MXUserTransction> {
  
  protected readonly logger = new Logger(MXUserTransctionRepository.name);

  constructor(
    @InjectRepository(MXUserTransction)
    itemsRepository: Repository<MXUserTransction>,
    entityManager: EntityManager,
  ) {
    super(itemsRepository, entityManager);
  }

  async getUserMxTransctionData(userId: number, limit: number) {
    try {
      const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10; // Default to 10 if limit is invalid
  
      const rawQuery = `
        SELECT DISTINCT 
          mxt.transctionGuid,
          v.companyName, 
          v.logoUrl, 
          v.websiteURL, 
          v.id as vendorId, 
          mxt.date,
          mxt.type,
          mxt.amount
        FROM 
          mx_user_transction mxt
        JOIN 
          vendors v ON mxt.merchantGuid = v.guid
        WHERE 
          mxt.userId = ?
        ORDER BY 
          mxt.date DESC   
        LIMIT ?
      `;
  
      try {
        const result = await this.getItemsRepository().query(rawQuery, [userId, safeLimit]);
        return result;
      } catch (error) {
        console.error(`Error executing raw query: ${error.message}`);
        throw new Error(`Error executing raw query: ${error.message}`);
      }
  
    } catch (err) {
      console.error(`Unexpected error: ${err.message}`);
      throw err;
    }
  }
  
  
  

}

