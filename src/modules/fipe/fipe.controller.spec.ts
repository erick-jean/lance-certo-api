import { Test, TestingModule } from '@nestjs/testing';
import { FipeController } from './fipe.controller';
import { FipeService } from './fipe.service';

describe('FipeController', () => {
  let controller: FipeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FipeController],
      providers: [FipeService],
    }).compile();

    controller = module.get<FipeController>(FipeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
