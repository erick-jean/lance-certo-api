import { Test, TestingModule } from '@nestjs/testing';
import { VehicleEvaluationsService } from './vehicle-evaluations.service';
import { beforeEach, describe, it } from 'node:test';

describe('VehicleEvaluationsService', () => {
  let service: VehicleEvaluationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VehicleEvaluationsService],
    }).compile();

    service = module.get<VehicleEvaluationsService>(VehicleEvaluationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
