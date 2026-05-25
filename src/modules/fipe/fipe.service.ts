import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseBrandsFipeApiDto } from './dto/response-brands-fipe-api.dto';
import { ResponseFipeInfoApiDto } from './dto/response-fipe-info-api.dto';
import { ResponseModelsFipeApiDto } from './dto/response-models-fipe-api.dto';
import { ResponseReferenceFipeApiDto } from './dto/response-reference-fipe-api.dto';
import { ResponseYearsFipeApiDto } from './dto/response-years-fipe-api.dto';
import { VehicleType } from './enums/vehicle-type.enum';

@Injectable()
export class FipeService {
  private readonly baseUrl: string;
  private readonly token?: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('FIPE_BASE_URL') ??
      'https://fipe.parallelum.com.br/api/v2';
    this.token = this.configService.get<string>('FIPE_TOKEN');
  }

  async getReferences(): Promise<ResponseReferenceFipeApiDto[]> {
    return this.requestFipe<ResponseReferenceFipeApiDto[]>('/references');
  }

  async getBrandsVehicles(
    vehicleType: VehicleType,
    reference?: number,
  ): Promise<ResponseBrandsFipeApiDto[]> {
    return this.requestFipe<ResponseBrandsFipeApiDto[]>(
      `/${vehicleType}/brands`,
      { reference },
    );
  }

  async getModelsVehicles(
    vehicleType: VehicleType,
    brandId: number,
    reference?: number,
  ): Promise<ResponseModelsFipeApiDto[]> {
    return this.requestFipe<ResponseModelsFipeApiDto[]>(
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
    return this.requestFipe<ResponseYearsFipeApiDto[]>(
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
    return this.requestFipe<ResponseFipeInfoApiDto>(
      `/${vehicleType}/brands/${brandId}/models/${modelId}/years/${yearId}`,
      { reference },
    );
  }

  private async requestFipe<T>(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);

    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(this.token ? { 'X-Subscription-Token': this.token } : {}),
        },
      });

      if (!response.ok) {
        throw new BadGatewayException(
          `Erro ao consultar FIPE. Status: ${response.status}`,
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new InternalServerErrorException('Erro interno ao consultar FIPE');
    }
  }
}
