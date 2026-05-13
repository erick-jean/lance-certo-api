import { Prisma } from '../../../generated/prisma/client';

export function isPrismaErrorCode(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

export const isUniqueConstraintError = (error: unknown) =>
  isPrismaErrorCode(error, 'P2002');

export const isRecordNotFoundError = (error: unknown) =>
  isPrismaErrorCode(error, 'P2025');

export const isSerializableConflict = (error: unknown) =>
  isPrismaErrorCode(error, 'P2034');
