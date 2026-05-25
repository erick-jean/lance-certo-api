import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseBrandsFipeApiDto } from './dto/response-brands-fipe-api.dto';
import { ResponseFipeInfoApiDto } from './dto/response-fipe-info-api.dto';
import { ResponseFipeReferenceDto } from './dto/response-fipe-reference.dto';
import { ResponseModelsFipeApiDto } from './dto/response-models-fipe-api.dto';
import { ResponseYearsFipeApiDto } from './dto/response-years-fipe-api.dto';
import { VehicleType } from './enums/vehicle-type.enum';

@Injectable()
export class FipeService {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('FIPE_BASE_URL') ??
      'https://fipe.parallelum.com.br/api/v2';
    this.token = this.configService.get<string>('FIPE_TOKEN');
    this.timeoutMs = Number(
      this.configService.get<string>('FIPE_TIMEOUT_MS') ?? 5000,
    );
  }

  async getReferences(): Promise<ResponseFipeReferenceDto[]> {
    return this.request<ResponseFipeReferenceDto[]>('/references');
  }

  async getBrandsVehicles(
    vehicleType: VehicleType,
    reference?: number,
  ): Promise<ResponseBrandsFipeApiDto[]> {
    return this.request<ResponseBrandsFipeApiDto[]>(`/${vehicleType}/brands`, {
      reference,
    });
  }

  async getModelsVehicles(
    vehicleType: VehicleType,
    brandId: number,
    reference?: number,
  ): Promise<ResponseModelsFipeApiDto[]> {
    return this.request<ResponseModelsFipeApiDto[]>(
      `/${vehicleType}/brands/${brandId}/models`,
      { reference },
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
    );
  }

  private async request<T>(
    path: string,
    query?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const normalizedBaseUrl = this.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${normalizedBaseUrl}${normalizedPath}`);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    try {
      /*
       * The FIPE API is an external dependency, so the timeout prevents one slow
       * upstream call from holding the request open indefinitely. Headers stay
       * centralized here so the token is never duplicated or accidentally logged.
       * Keeping the integration behind this method also makes all public methods
       * share the same error handling and request rules.
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

      return (await response.json()) as T;
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
}
