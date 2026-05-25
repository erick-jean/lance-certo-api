import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseBrandsFipeApiDto } from './dto/response-brands-fipe-api.dto';
import { ResponseFipeInfoApiDto } from './dto/response-fipe-info-api.dto';
import { ResponseFipeReferenceDto } from './dto/response-fipe-reference.dto';
import { ResponseModelsFipeApiDto } from './dto/response-models-fipe-api.dto';
import { ResponseYearsFipeApiDto } from './dto/response-years-fipe-api.dto';
import { VehicleType } from './enums/vehicle-type.enum';

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

@Injectable()
export class FipeService {
  private static readonly ONE_HOUR_MS = 60 * 60 * 1000;
  private static readonly CACHE_TTL_MS = {
    references: 12 * FipeService.ONE_HOUR_MS,
    brands: 24 * FipeService.ONE_HOUR_MS,
    models: 24 * FipeService.ONE_HOUR_MS,
    years: 24 * FipeService.ONE_HOUR_MS,
    info: 6 * FipeService.ONE_HOUR_MS,
  } as const;

  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly timeoutMs: number;
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly configService: ConfigService) {
    const configuredBaseUrl =
      this.configService.get<string>('FIPE_BASE_URL')?.trim();
    const configuredToken = this.configService
      .get<string>('FIPE_TOKEN')
      ?.trim();
    const configuredTimeout = Number(
      this.configService.get<number | string>('FIPE_TIMEOUT_MS') ?? 5000,
    );

    this.baseUrl =
      configuredBaseUrl || 'https://fipe.parallelum.com.br/api/v2';
    this.token = configuredToken || undefined;
    this.timeoutMs =
      Number.isFinite(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout
        : 5000;
  }

  async getReferences(): Promise<ResponseFipeReferenceDto[]> {
    return this.request<ResponseFipeReferenceDto[]>(
      '/references',
      undefined,
      FipeService.CACHE_TTL_MS.references,
    );
  }

  async getBrandsVehicles(
    vehicleType: VehicleType,
    reference?: number,
  ): Promise<ResponseBrandsFipeApiDto[]> {
    return this.request<ResponseBrandsFipeApiDto[]>(
      `/${vehicleType}/brands`,
      { reference },
      FipeService.CACHE_TTL_MS.brands,
    );
  }

  async getModelsVehicles(
    vehicleType: VehicleType,
    brandId: number,
    reference?: number,
  ): Promise<ResponseModelsFipeApiDto[]> {
    return this.request<ResponseModelsFipeApiDto[]>(
      `/${vehicleType}/brands/${brandId}/models`,
      { reference },
      FipeService.CACHE_TTL_MS.models,
    );
  }

  async getYearsByModel(
    vehicleType: VehicleType,
    brandId: number,
    modelId: number,
    reference?: number,
  ): Promise<ResponseYearsFipeApiDto[]> {
    return this.request<ResponseYearsFipeApiDto[]>(
      `/${vehicleType}/brands/${brandId}/models/${modelId}/years`,
      { reference },
      FipeService.CACHE_TTL_MS.years,
    );
  }

  async getFipeInfo(
    vehicleType: VehicleType,
    brandId: number,
    modelId: number,
    yearId: string,
    reference?: number,
  ): Promise<ResponseFipeInfoApiDto> {
    return this.request<ResponseFipeInfoApiDto>(
      `/${vehicleType}/brands/${brandId}/models/${modelId}/years/${yearId}`,
      { reference },
      FipeService.CACHE_TTL_MS.info,
    );
  }

  private async request<T>(
    path: string,
    query?: Record<string, string | number | undefined>,
    ttlMs?: number,
  ): Promise<T> {
    const normalizedBaseUrl = this.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${normalizedBaseUrl}${normalizedPath}`);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    const cacheKey = this.getCacheKey(normalizedPath, query);
    const cached = ttlMs ? this.getCachedValue<T>(cacheKey) : undefined;

    if (cached !== undefined) {
      return cached;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      /*
       * The FIPE API is an external dependency, so the timeout prevents one slow
       * upstream call from holding the request open indefinitely. Headers stay
       * centralized here so the token is never duplicated or accidentally logged.
       * Keeping the integration behind this method also makes all public methods
       * share the same error handling and request rules.
       * Successful responses are cached to protect the daily FIPE API quota.
       */
      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(this.token ? { 'X-Subscription-Token': this.token } : {}),
        },
      });

      if (!response.ok) {
        throw new BadGatewayException(
          'Nao foi possivel consultar a FIPE no momento',
        );
      }

      const data = (await response.json()) as T;

      if (ttlMs) {
        this.cache.set(cacheKey, {
          expiresAt: Date.now() + ttlMs,
          value: data,
        });
      }

      return data;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      if (controller.signal.aborted) {
        throw new BadGatewayException(
          'Tempo limite excedido ao consultar a FIPE',
        );
      }

      throw new BadGatewayException(
        'Nao foi possivel consultar a FIPE no momento',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private getCacheKey(
    path: string,
    query?: Record<string, string | number | undefined>,
  ): string {
    const params = Object.entries(query ?? {})
      .filter(([, value]) => value !== undefined && value !== null)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, value]) => `${key}=${String(value)}`)
      .join('&');

    return params ? `${path}?${params}` : path;
  }

  private getCachedValue<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }
}
