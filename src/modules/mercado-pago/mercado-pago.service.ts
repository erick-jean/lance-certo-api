import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

interface CreatePreapprovalParams {
  userId: string;
  payerEmail: string;
  cardTokenId: string;
}

export interface MercadoPagoPreapprovalResponse {
  id: string;
  status: string;
  payer_email?: string | null;
  payer_id?: number | string | null;
  collector_id?: number | string | null;
  reason?: string | null;
  external_reference?: string | null;
  next_payment_date?: string | null;
  auto_recurring?: {
    transaction_amount?: number;
    currency_id?: string;
    start_date?: string | null;
    end_date?: string | null;
  };
  [key: string]: unknown;
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly baseUrl = 'https://api.mercadopago.com';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Creates a new preapproval subscription in Mercado Pago.
   * @param params userId, payerEmail, and cardTokenId.
   * @returns The response from Mercado Pago containing subscription details.
   */
  async createPreapprovalSubscription(
    params: CreatePreapprovalParams,
  ): Promise<MercadoPagoPreapprovalResponse> {
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
      const response = await axios.post<MercadoPagoPreapprovalResponse>(
        `${this.baseUrl}/preapproval`,
        {
          preapproval_plan_id: planId,
          reason: 'Assinatura Premium - Lance Certo',
          external_reference: params.userId,
          payer_email: params.payerEmail,
          card_token_id: params.cardTokenId,
          status: 'authorized',
          back_url: `${this.configService.getOrThrow<string>(
            'APP_FRONTEND_URL',
          )}/assinatura/sucesso`,
          notification_url: this.getWebhookUrl(),
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao criar assinatura no Mercado Pago',
        this.resolveMercadoPagoError(error),
      );

      throw new InternalServerErrorException(
        'Não foi possível criar a assinatura no Mercado Pago.',
      );
    }
  }

  async getPreapproval(
    preapprovalId: string,
  ): Promise<MercadoPagoPreapprovalResponse> {
    const accessToken = this.configService.get<string>(
      'MERCADO_PAGO_ACCESS_TOKEN',
    );

    if (!accessToken) {
      throw new InternalServerErrorException(
        'Access Token do Mercado Pago não configurado.',
      );
    }

    try {
      const response = await axios.get<MercadoPagoPreapprovalResponse>(
        `${this.baseUrl}/preapproval/${preapprovalId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error: unknown) {
      this.logger.error(
        'Erro ao buscar assinatura no Mercado Pago',
        this.resolveMercadoPagoError(error),
      );

      throw new InternalServerErrorException(
        'Não foi possível consultar a assinatura no Mercado Pago.',
      );
    }
  }

  private resolveMercadoPagoError(error: unknown): unknown {
    if (error instanceof AxiosError) {
      return error.response?.data ?? error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return error;
  }

  private getWebhookUrl(): string | undefined {
    const configuredUrl = this.configService.get<string>(
      'MERCADO_PAGO_WEBHOOK_URL',
    );

    if (!configuredUrl) {
      return undefined;
    }

    const url = new URL(configuredUrl);
    url.searchParams.set('source_news', 'webhooks');

    return url.toString();
  }
}
