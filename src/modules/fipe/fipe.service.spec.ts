import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { VehicleType } from './enums/vehicle-type.enum';
import { FipeService } from './fipe.service';

type ConfigValues = {
  FIPE_BASE_URL?: string;
  FIPE_TIMEOUT_MS?: string;
  FIPE_TOKEN?: string;
};

const BASE_URL = 'https://fipe.parallelum.com.br/api/v2';

describe('FipeService', () => {
  let service: FipeService;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  const createService = async (
    configValues: ConfigValues = {},
  ): Promise<FipeService> => {
    const configService: Pick<ConfigService, 'get'> = {
      get: jest.fn((key: keyof ConfigValues) => {
        const defaults: ConfigValues = {
          FIPE_BASE_URL: BASE_URL,
          FIPE_TIMEOUT_MS: '5000',
        };

        return configValues[key] ?? defaults[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FipeService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    return module.get<FipeService>(FipeService);
  };

  const mockResponse = (body: unknown, ok = true): Response =>
    ({
      ok,
      json: jest.fn().mockResolvedValue(body),
    }) as unknown as Response;

  const getFetchUrl = (): URL => {
    const [url] = fetchMock.mock.calls[0];

    if (typeof url !== 'string') {
      throw new Error('Expected fetch URL to be a string');
    }

    return new URL(url);
  };

  const getFetchInit = (): RequestInit => {
    const [, init] = fetchMock.mock.calls[0];
    return init ?? {};
  };

  beforeEach(async () => {
    fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(mockResponse([]));
    service = await createService();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send X-Subscription-Token when FIPE_TOKEN exists', async () => {
    service = await createService({ FIPE_TOKEN: 'secret-token' });
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    await service.getReferences();

    expect(getFetchInit().headers).toEqual({
      Accept: 'application/json',
      'X-Subscription-Token': 'secret-token',
    });
  });

  it('should not send X-Subscription-Token when FIPE_TOKEN is empty', async () => {
    service = await createService({ FIPE_TOKEN: '' });
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    await service.getReferences();

    expect(getFetchInit().headers).toEqual({
      Accept: 'application/json',
    });
  });

  it('should include reference in the query string', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    await service.getBrandsVehicles(VehicleType.CARS, 308);

    expect(getFetchUrl().searchParams.get('reference')).toBe('308');
  });

  it('should throw BadGatewayException when FIPE response is not ok', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ message: 'error' }, false));

    await expect(service.getReferences()).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('should throw BadGatewayException on timeout', async () => {
    jest.useFakeTimers();
    service = await createService({ FIPE_TIMEOUT_MS: '10' });
    fetchMock.mockImplementationOnce(
      (_url: URL | RequestInfo, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );

    const request = service.getReferences();
    const expectation =
      expect(request).rejects.toBeInstanceOf(BadGatewayException);

    await jest.advanceTimersByTimeAsync(10);
    await expectation;
  });

  it('should build the references path correctly', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    await service.getReferences();

    expect(getFetchUrl().pathname).toBe('/api/v2/references');
  });

  it('should build the brands path correctly', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    await service.getBrandsVehicles(VehicleType.CARS);

    expect(getFetchUrl().pathname).toBe('/api/v2/cars/brands');
  });

  it('should build the models path correctly', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    await service.getModelsVehicles(VehicleType.CARS, 59);

    expect(getFetchUrl().pathname).toBe('/api/v2/cars/brands/59/models');
  });

  it('should build the years path correctly', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    await service.getYearsByModel(VehicleType.CARS, 59, 5940);

    expect(getFetchUrl().pathname).toBe(
      '/api/v2/cars/brands/59/models/5940/years',
    );
  });

  it('should build the FIPE info path correctly', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ price: 'R$ 10.000,00' }));

    await service.getFipeInfo(VehicleType.CARS, 59, 5940, '2014-3');

    expect(getFetchUrl().pathname).toBe(
      '/api/v2/cars/brands/59/models/5940/years/2014-3',
    );
  });

  it('should avoid a second fetch call for the same cache key', async () => {
    const brands = [{ code: '59', name: 'Volkswagen' }];
    fetchMock.mockResolvedValueOnce(mockResponse(brands));

    const firstResponse = await service.getBrandsVehicles(
      VehicleType.CARS,
      308,
    );
    const secondResponse = await service.getBrandsVehicles(
      VehicleType.CARS,
      308,
    );

    expect(firstResponse).toBe(brands);
    expect(secondResponse).toBe(brands);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
