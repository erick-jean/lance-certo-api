import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VehicleType } from './enums/vehicle-type.enum';
import { ResponseBrandsFipeApiDto } from './dto/response-brands-fipe-api.dto';
import { ResponseModelsFipeApiDto } from './dto/response-models-fipe-api.dto';
import { ResponseYearsFipeApiDto } from './dto/response-years-fipe-api.dto';
import { ResponseFipeInfoApiDto } from './dto/response-fipe-info-api.dto';

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

  // Método para buscar as marcas de veículos com base no tipo e na referência
  async getBrandsVehicles(
    vehicleType: VehicleType,
    reference?: number,
  ): Promise<ResponseBrandsFipeApiDto[]> {
    const url = new URL(`${this.baseUrl}/${vehicleType}/brands`);

    if (reference) {
      url.searchParams.set('reference', String(reference));
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(this.token && {
            'X-Subscription-Token': this.token,
          }),
        },
      });

      if (!response.ok) {
        throw new BadGatewayException(
          `Erro ao consultar marcas na FIPE. Status: ${response.status}`,
        );
      }

      return (await response.json()) as ResponseBrandsFipeApiDto[];
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno ao buscar marcas na FIPE',
      );
    }
  }

  // Método para buscar os modelos de um veículo com base no tipo e na marca
  async getModelsVehicles(
    vehicleType: VehicleType,
    brandId: number,
  ): Promise<ResponseModelsFipeApiDto[]> {
    const url = new URL(
      `${this.baseUrl}/${vehicleType}/brands/${brandId}/models`,
    );

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(this.token && {
            'X-Subscription-Token': this.token,
          }),
        },
      });

      if (!response.ok) {
        throw new BadGatewayException(
          `Erro ao consultar modelos na FIPE. Status: ${response.status}`,
        );
      }

      return (await response.json()) as ResponseModelsFipeApiDto[];
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno ao buscar modelos na FIPE',
      );
    }
  }

  // Metodo para buscar os anos de um modelo especifico
  async getYearsByModel(
    vehicleType: VehicleType,
    brandId: number,
    modelId: number,
    reference?: number,
  ): Promise<ResponseYearsFipeApiDto[]> {
    const url = new URL(
      `${this.baseUrl}/${vehicleType}/brands/${brandId}/models/${modelId}/years`,
    );

    if (reference) {
      url.searchParams.set('reference', String(reference));
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(this.token && {
            'X-Subscription-Token': this.token,
          }),
        },
      });

      if (!response.ok) {
        throw new BadGatewayException(
          `Erro ao consultar anos do modelo na FIPE. Status: ${response.status}`,
        );
      }

      return (await response.json()) as ResponseYearsFipeApiDto[];
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno ao buscar anos do modelo na FIPE',
      );
    }
  }

  // Metodo para buscar as informacoes FIPE de um veiculo especifico
  async getFipeInfo(
    vehicleType: VehicleType,
    brandId: number,
    modelId: number,
    yearId: string,
    reference?: number,
  ): Promise<ResponseFipeInfoApiDto> {
    const url = new URL(
      `${this.baseUrl}/${vehicleType}/brands/${brandId}/models/${modelId}/years/${yearId}`,
    );

    if (reference) {
      url.searchParams.set('reference', String(reference));
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(this.token && {
            'X-Subscription-Token': this.token,
          }),
        },
      });

      if (!response.ok) {
        throw new BadGatewayException(
          `Erro ao consultar informacoes FIPE. Status: ${response.status}`,
        );
      }

      return (await response.json()) as ResponseFipeInfoApiDto;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro interno ao buscar informacoes FIPE',
      );
    }
  }
}
