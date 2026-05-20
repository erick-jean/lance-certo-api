import { Prisma } from '../../../generated/prisma/client';

export const userResponseSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  plan: true,
  planStatus: true,
  planExpiresAt: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
} satisfies Prisma.UserSelect;

export type UserResponseRecord = Prisma.UserGetPayload<{
  select: typeof userResponseSelect;
}>;
