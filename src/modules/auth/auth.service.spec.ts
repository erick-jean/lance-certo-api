import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from 'src/common/enums/user-role.enum';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const makeService = () => {
    const prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      passwordResetToken: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    };
    const hashService = {
      compare: jest.fn(),
      hash: jest.fn().mockResolvedValue('hashed-password'),
    };
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          JWT_REFRESH_EXPIRES_DAYS: 7,
          APP_FRONTEND_URL: 'http://localhost:3000',
        };

        return values[key];
      }),
    };
    const emailService = {
      sendPasswordResetEmail: jest.fn(),
    };

    const service = new AuthService(
      prisma as never,
      jwtService as never,
      hashService as never,
      configService as never,
      emailService as never,
    );

    return { service, prisma, hashService };
  };

  it('rejeita login com credencial inválida', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.signIn({ email: 'user@email.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita login de usuário inativo', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@email.com',
      password: 'hashed-password',
      role: UserRole.USER,
      isActive: false,
    });

    await expect(
      service.signIn({ email: 'user@email.com', password: 'password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita refresh token inválido ou revogado', async () => {
    const { service, prisma } = makeService();
    prisma.refreshToken.findFirst.mockResolvedValue(null);

    await expect(service.refresh('revoked-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('revoga refresh tokens ativos ao redefinir senha', async () => {
    const { service, prisma } = makeService();
    const tx = {
      passwordResetToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      user: {
        update: jest.fn().mockResolvedValue({}),
      },
      refreshToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
        create: jest.fn(),
      },
    };

    prisma.passwordResetToken.findFirst.mockResolvedValue({
      id: 'reset-token-1',
      userId: 'user-1',
    });
    prisma.$transaction.mockImplementation(
      (callback: (transaction: typeof tx) => unknown) => callback(tx),
    );

    await service.resetPassword({
      token: 'reset-token',
      password: 'new-password',
    });

    const [updateManyArgs] = tx.refreshToken.updateMany.mock.calls[0] as [
      {
        data: { revokedAt: unknown };
        where: { revokedAt: null; userId: string };
      },
    ];

    expect(updateManyArgs.where).toEqual({
      userId: 'user-1',
      revokedAt: null,
    });
    expect(updateManyArgs.data.revokedAt).toBeInstanceOf(Date);
  });

  it('rejeita reset de senha com token inválido', async () => {
    const { service, prisma } = makeService();
    prisma.passwordResetToken.findFirst.mockResolvedValue(null);

    await expect(
      service.resetPassword({ token: 'invalid-token', password: 'new-pass' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
