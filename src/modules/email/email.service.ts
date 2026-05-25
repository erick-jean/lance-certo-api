import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
  ): Promise<void> {
    const transporter = this.createTransporter();

    if (!transporter) {
      this.handleMissingSmtpConfig(email);
      return;
    }

    try {
      await transporter.sendMail({
        from: this.getEmailFrom(),
        to: email,
        subject: 'Redefinicao de senha - Lance Certo',
        text: [
          'Voce solicitou a redefinicao de senha da sua conta Lance Certo.',
          '',
          `Acesse o link abaixo para criar uma nova senha:`,
          resetLink,
          '',
          'Se voce nao solicitou essa alteracao, ignore este e-mail.',
        ].join('\n'),
        html: `
          <p>Voce solicitou a redefinicao de senha da sua conta Lance Certo.</p>
          <p><a href="${resetLink}">Clique aqui para criar uma nova senha</a>.</p>
          <p>Se voce nao solicitou essa alteracao, ignore este e-mail.</p>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Falha ao enviar e-mail de redefinicao de senha para ${email}.`,
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException(
        'Nao foi possivel enviar o e-mail de redefinicao de senha.',
      );
    }
  }

  private createTransporter(): Transporter | null {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');

    if (!host || !port) {
      return null;
    }

    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    return nodemailer.createTransport({
      host,
      port,
      secure: this.configService.get<boolean>('SMTP_SECURE') ?? false,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  private handleMissingSmtpConfig(email: string): void {
    if (this.configService.getOrThrow<string>('NODE_ENV') === 'production') {
      this.logger.error(
        'SMTP nao configurado em producao. Link de reset nao sera exibido em logs.',
      );

      throw new InternalServerErrorException(
        'Servico de e-mail nao configurado.',
      );
    }

    this.logger.warn(
      `SMTP nao configurado. E-mail de reset nao enviado para ${email}. Token omitido dos logs.`,
    );
  }

  private getEmailFrom(): string {
    return this.configService.getOrThrow<string>('EMAIL_FROM');
  }
}
