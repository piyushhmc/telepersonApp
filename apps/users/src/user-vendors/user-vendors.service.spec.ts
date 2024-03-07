import { Test, TestingModule } from '@nestjs/testing';
import { UserVendorsService } from './user-vendors.service';

describe('UserVendorsService', () => {
  let service: UserVendorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserVendorsService],
    }).compile();

    service = module.get<UserVendorsService>(UserVendorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
