import { Test, TestingModule } from '@nestjs/testing';
import { VehicleEvaluationsController } from './vehicle-evaluations.controller';
import { VehicleEvaluationsService } from './vehicle-evaluations.service';
import { beforeEach, describe, it } from 'node:test';

describe('VehicleEvaluationsController', () => {
  let controller: VehicleEvaluationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleEvaluationsController],
      providers: [VehicleEvaluationsService],
    }).compile();

    controller = module.get<VehicleEvaluationsController>(VehicleEvaluationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
