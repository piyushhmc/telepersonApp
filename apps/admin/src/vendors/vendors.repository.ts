
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

  async saveVendor(vendorEntity: Vendors) {
    return await this.getItemsRepository().save(vendorEntity)
  }

  async findVendor(id: number) {
    return this.getItemsRepository().findOneBy({ id: id });
  }


  async vendorList(search: string, page: number, sortBy: string, take: number, status: string) {
    const skip = (page - 1) * take; // number of records to skip
    const builder = this.getItemsRepository().createQueryBuilder('vendors');
    search = search?.trim() ?? "";
    status = status?.trim() ?? "";

    if (search) {
      builder.where('vendors.companyName LIKE :search', { search: `%${search}%` });
    }

    if (status) {
      builder.andWhere('vendors.approvalStatus LIKE :status', { status: `%${status}%` });
    }

    // Add condition to exclude deleted vendors
    builder.andWhere('vendors.approvalStatus != :deletedStatus', { deletedStatus: "DELETED" });

    const order = sortBy.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const query = builder.andWhere('vendors.deletedAt IS NULL');

    const total = await query.getCount();

    query.orderBy('vendors.companyName', order)
      .skip(skip)
      .take(take);

    const vendorList = await query.getMany();

    return {
      vendorList,
      pageResult: {
        total,
        page,
        lastPage: Math.ceil(total / take)
      }
    };
  }

  async vendorIntentManagementListbyVendorId(id: number, search: string, page: number, pageSize: number) {

    const offset = (page - 1) * pageSize;
    const rawQuery = `SELECT  i.id as intentId,vi.id as vendorIntentId,i.intentName, vi.algorithm, vi.status, vi.buttonDiscription, vi.buttoncomments
    FROM intents i
    LEFT JOIN vendor_intents vi ON i.id = vi.intentId 
    where  vi.vendorId =${id} ${search ? "AND v.companyName LIKE '%" + search + "%'" : ""}
    order by vi.id DESC`

    const countQuery = `
    SELECT COUNT(DISTINCT i.intentName) AS total
    FROM intents i
    LEFT JOIN vendor_intents vi ON i.id = vi.intentId 
    where  vi.vendorId =${id}`

    try {
      const [result, totalResult] = await Promise.all([
        this.getItemsRepository().query(rawQuery),
        this.getItemsRepository().query(countQuery),
      ]);
      const total = totalResult[0].total; // Assuming totalResult[0] contains the count
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: result,
        pagination: {
          total,
          page,
          pageSize,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.log(error)
      throw new Error(`Error executing  query: ${error.message}`);
    }

  }

  async vendorIntentManagementList(search: string, page: number, pageSize: number, orderBy: string, sortOnColumn: string) {

    const offset = (page - 1) * pageSize;

    const rawQuery = `SELECT v.companyName AS companyName, 
    COUNT(DISTINCT uv.userId) AS countUser,v.industry as sector,v.id as vendorId,
    uv.id as userVendorId,
    MIN(uv.assignedDate) addedAt, count( Distinct( vi.intentId)) as calltree,
    (SELECT COUNT(DISTINCT vi.intentId) FROM vendor_intents vi WHERE vi.vendorId = v.id AND vi.status = ${1}) as completedCallTree,
    v.approvalStatus as status
    FROM vendors v
    LEFT JOIN user_vendors uv ON v.id = uv.vendorId AND uv.isActive = ${1}
    Left join vendor_intents vi on v.id = vi.vendorId 
    WHERE ${search ? `v.companyName LIKE '%${search}%'` : '1=1'}
    AND v.approvalStatus NOT IN ('SUBMITTED', 'DELETED')
    GROUP BY v.companyCode
    order by ${sortOnColumn} ${orderBy}  LIMIT ${pageSize}  OFFSET ${offset}`;

    // Query to count the total number of records
    const countQuery = `
    SELECT COUNT(DISTINCT v.companyCode) AS total
    FROM vendors v
    LEFT JOIN user_vendors uv ON v.id = uv.vendorId AND uv.isActive = ${1}
    WHERE ${search ? `v.companyName LIKE '%${search}%'` : '1=1'}`;

    try {
      const [result, totalResult] = await Promise.all([
        this.getItemsRepository().query(rawQuery),
        this.getItemsRepository().query(countQuery),
      ]);

      const total = totalResult[0].total; // Assuming totalResult[0] contains the count
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: result,
        pagination: {
          total,
          page,
          pageSize,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(`Error executing  query: ${error.message}`);
    }

  }

  async subscribeVendorIntentManagementList(search: string, page: number, pageSize: number, orderBy: string, sortOnColumn: string) {

    const offset = (page - 1) * pageSize;


    const rawQuery = `SELECT v.companyName AS companyName, 
    COUNT(DISTINCT uv.userId) AS countUser,v.industry as sector,v.id as vendorId,
    uv.id as userVendorId,
    MIN(uv.assignedDate) addedAt, count( Distinct( vi.intentId)) as calltree,
    (SELECT COUNT(DISTINCT vi.intentId) FROM vendor_intents vi WHERE vi.vendorId = v.id AND vi.status = ${1}) as completedCallTree,
    v.approvalStatus as status
    FROM user_vendors uv
    LEFT JOIN vendors v ON v.id = uv.vendorId 
    Left join vendor_intents vi on v.id = vi.vendorId 
    WHERE uv.isActive = 1 ${search ? "AND v.companyName LIKE '%" + search + "%'" : ""}
    AND v.approvalStatus NOT IN ('SUBMITTED', 'DELETED')
    GROUP BY v.companyCode
    order by ${sortOnColumn} ${orderBy}  LIMIT ${pageSize}  OFFSET ${offset}`;

    // Query to count the total number of records
    const countQuery = `
    SELECT COUNT(DISTINCT v.companyCode) AS total
    FROM user_vendors uv
    LEFT JOIN vendors v ON v.id = uv.vendorId
    WHERE uv.isActive = 1
    ${search ? "AND v.companyName LIKE '%" + search + "%'" : ""}`;

    try {
      const [result, totalResult] = await Promise.all([
        this.getItemsRepository().query(rawQuery),
        this.getItemsRepository().query(countQuery),
      ]);

      const total = totalResult[0].total; // Assuming totalResult[0] contains the count
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: result,
        pagination: {
          total,
          page,
          pageSize,
          totalPages,
        },
      };
    } catch (error) {
      throw new Error(`Error executing  query: ${error.message}`);
    }
  }

  async getVendorSubscribedUserEmail(vendorId: number) {
    try {
      const rawQuery = `SELECT  usr.email,usr.firstName
        FROM vendors v
        LEFT JOIN user_vendors uv ON v.id = uv.vendorId 
        LEFT JOIN user usr ON uv.userId = usr.id 
        where  v.id =${vendorId} AND usr.deletedAt is null`;

        const [result] =  await Promise.all([
          this.getItemsRepository().query(rawQuery)
        ]);

        return result
    }
    catch (err) {
      this.logger.log(err.message)
      throw new Error(`Error executing  query: ${err.message}`);
    }
  }
}
