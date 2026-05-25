import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth/auth.guard';
import { VehicleType } from './enums/vehicle-type.enum';
import { FipeController } from './fipe.controller';
import { FipeService } from './fipe.service';

describe('FipeController', () => {
  let controller: FipeController;
  let fipeService: jest.Mocked<
    Pick<
      FipeService,
      | 'getReferences'
      | 'getBrandsVehicles'
      | 'getModelsVehicles'
      | 'getYearsByModel'
      | 'getFipeInfo'
    >
  >;

  beforeEach(async () => {
    fipeService = {
      getReferences: jest.fn(),
      getBrandsVehicles: jest.fn(),
      getModelsVehicles: jest.fn(),
      getYearsByModel: jest.fn(),
      getFipeInfo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FipeController],
      providers: [
        {
          provide: FipeService,
          useValue: fipeService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get<FipeController>(FipeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get references', async () => {
    const references = [{ code: '308', month: 'abril de 2024' }];
    fipeService.getReferences.mockResolvedValue(references);

    await expect(controller.getReferences()).resolves.toBe(references);
    expect(fipeService.getReferences).toHaveBeenCalledTimes(1);
  });

  it('should get brands by vehicle type', async () => {
    const brands = [{ code: '59', name: 'Volkswagen' }];
    fipeService.getBrandsVehicles.mockResolvedValue(brands);

    await expect(
      controller.getBrandsVehicles(VehicleType.CARS, 308),
    ).resolves.toBe(brands);
    expect(fipeService.getBrandsVehicles).toHaveBeenCalledWith(
      VehicleType.CARS,
      308,
    );
  });

  it('should get models by brand', async () => {
    const models = [{ code: '5940', name: 'AMAROK' }];
    fipeService.getModelsVehicles.mockResolvedValue(models);

    await expect(
      controller.getModelsVehicles(VehicleType.CARS, 59, 308),
    ).resolves.toBe(models);
    expect(fipeService.getModelsVehicles).toHaveBeenCalledWith(
      VehicleType.CARS,
      59,
      308,
    );
  });

  it('should get years by model', async () => {
    const years = [{ code: '2014-3', name: '2014 Diesel' }];
    fipeService.getYearsByModel.mockResolvedValue(years);

    await expect(
      controller.getYearsByModel(VehicleType.CARS, 59, 5940, 308),
    ).resolves.toBe(years);
    expect(fipeService.getYearsByModel).toHaveBeenCalledWith(
      VehicleType.CARS,
      59,
      5940,
      308,
    );
  });

  it('should get FIPE info', async () => {
    const info = {
      brand: 'VW - VolksWagen',
      codeFipe: '005340-6',
      fuel: 'Diesel',
      fuelAcronym: 'D',
      model: 'AMAROK',
      modelYear: 2014,
      price: 'R$ 10.000,00',
      priceHistory: [],
      referenceMonth: 'abril de 2024',
      vehicleType: 1,
    };
    fipeService.getFipeInfo.mockResolvedValue(info);

    await expect(
      controller.getFipeInfo(VehicleType.CARS, 59, 5940, '2014-3', 308),
    ).resolves.toBe(info);
    expect(fipeService.getFipeInfo).toHaveBeenCalledWith(
      VehicleType.CARS,
      59,
      5940,
      '2014-3',
      308,
    );
  });
});
