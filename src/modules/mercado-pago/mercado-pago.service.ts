import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface CreatePreapprovalParams {
  userId: string;
  payerEmail: string;
  cardTokenId: string;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly baseUrl = 'https://api.mercadopago.com';

  constructor(private readonly configService: ConfigService) {}

  async createPreapprovalSubscription(params: CreatePreapprovalParams) {
    const accessToken = this.configService.get<string>(
      'MERCADO_PAGO_ACCESS_TOKEN',
    );

    const planId = this.configService.get<string>(
      'MERCADO_PAGO_PREMIUM_PLAN_ID',
    );

    if (!accessToken || !planId) {
      throw new InternalServerErrorException(
        'Credenciais do Mercado Pago não configuradas.',
      );
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/preapproval`,
        {
          preapproval_plan_id: planId,
          reason: 'Assinatura Premium - Lance Certo',
          external_reference: params.userId,
          payer_email: params.payerEmail,
          card_token_id: params.cardTokenId,
          status: 'authorized',
          back_url:
            this.configService.get<string>('FRONTEND_URL') +
            '/assinatura/sucesso',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Erro ao criar assinatura no Mercado Pago',
        error?.response?.data || error?.message,
      );

      throw new InternalServerErrorException(
        'Não foi possível criar a assinatura no Mercado Pago.',
      );
    }
  }

  async getPreapproval(preapprovalId: string) {
    const accessToken = this.configService.get<string>(
      'MERCADO_PAGO_ACCESS_TOKEN',
    );

    if (!accessToken) {
      throw new InternalServerErrorException(
        'Access Token do Mercado Pago não configurado.',
      );
    }

    try {
      const response = await axios.get(
        `${this.baseUrl}/preapproval/${preapprovalId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Erro ao buscar assinatura no Mercado Pago',
        error?.response?.data || error?.message,
      );

      throw new InternalServerErrorException(
        'Não foi possível consultar a assinatura no Mercado Pago.',
      );
    }
  }
}
