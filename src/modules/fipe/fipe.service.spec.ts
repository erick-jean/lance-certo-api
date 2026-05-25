import { Test, TestingModule } from '@nestjs/testing';
import { FipeService } from './fipe.service';

describe('FipeService', () => {
  let service: FipeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FipeService],
    }).compile();

    service = module.get<FipeService>(FipeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
