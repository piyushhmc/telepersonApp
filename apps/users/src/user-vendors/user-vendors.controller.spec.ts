import { Test, TestingModule } from '@nestjs/testing';
import { UserVendorsController } from './user-vendors.controller';

describe('UserVendorsController', () => {
  let controller: UserVendorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserVendorsController],
    }).compile();

    controller = module.get<UserVendorsController>(UserVendorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
