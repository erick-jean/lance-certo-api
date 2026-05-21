import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from 'src/common/enums/user-role.enum';
import {
  SubscriptionPlan,
  SubscriptionPlanStatus,
} from '../../../../generated/prisma/client';

type ResponseUserInput = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: SubscriptionPlan;
  planStatus: SubscriptionPlanStatus;
  planExpiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
};

export class ResponseUserDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  id!: string;

  @ApiProperty({ example: 'User' })
  name!: string;

  @ApiProperty({ example: 'user@email.com' })
  email!: string;

  @ApiProperty({ example: UserRole.USER, enum: UserRole })
  role!: UserRole;

  @ApiProperty({ example: 'FREE', enum: SubscriptionPlan })
  plan!: SubscriptionPlan;

  @ApiProperty({
    example: 'NONE',
    enum: SubscriptionPlanStatus,
  })
  planStatus!: SubscriptionPlanStatus;

  @ApiProperty({
    example: '2026-06-05T00:00:00.000Z',
    required: false,
    nullable: true,
    type: String,
    format: 'date-time',
  })
  planExpiresAt?: Date | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt!: Date;

  @ApiProperty({
    example: '2026-01-02T10:00:00.000Z',
    required: false,
    nullable: true,
    type: String,
    format: 'date-time',
  })
  lastLogin?: Date | null;

  constructor(user: ResponseUserInput) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.plan = user.plan;
    this.planStatus = user.planStatus;
    this.planExpiresAt = user.planExpiresAt;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.lastLogin = user.lastLogin;
  }
}
