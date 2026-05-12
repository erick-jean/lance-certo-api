import { ApiProperty } from '@nestjs/swagger';
import {
  EvaluationRecommendation,
  EvaluationRiskLevel,
} from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';

type ResponseEvalutionVehicleInput = {
  desiredProfitMarginPercent: Prisma.Decimal | null;
  safetyMarginPercent: Prisma.Decimal | null;
  maxRecommendedBid: Prisma.Decimal | null;
  estimatedFinalCost: Prisma.Decimal | null;
  estimatedProfit: Prisma.Decimal | null;
} & Omit<
  Partial<ResponseEvalutionVehicleDto>,
  | 'desiredProfitMarginPercent'
  | 'safetyMarginPercent'
  | 'maxRecommendedBid'
  | 'estimatedFinalCost'
  | 'estimatedProfit'
>;

export class ResponseEvalutionVehicleDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  id!: string;

  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  vehicleId!: string;

  @ApiProperty({ example: 15, nullable: true })
  desiredProfitMarginPercent!: number | null;

  @ApiProperty({ example: 5, nullable: true })
  safetyMarginPercent!: number | null;

  @ApiProperty({ example: 25000, nullable: true })
  maxRecommendedBid!: number | null;

  @ApiProperty({ example: 20000, nullable: true })
  estimatedFinalCost!: number | null;

  @ApiProperty({ example: 10000, nullable: true })
  estimatedProfit!: number | null;

  @ApiProperty({
    enum: EvaluationRiskLevel,
    nullable: true,
  })
  riskLevel!: EvaluationRiskLevel | null;

  @ApiProperty({
    enum: EvaluationRecommendation,
    nullable: true,
  })
  recommendation!: EvaluationRecommendation | null;

  @ApiProperty({
    example: true,
    description: 'Indicates whether the evaluation is complete.',
  })
  isComplete!: boolean;

  @ApiProperty({
    example: '2026-05-08T15:30:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  lastCalculatedAt!: Date | null;

  @ApiProperty({
    example: '2026-05-08T15:30:00.000Z',
    nullable: false,
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-05-08T15:30:00.000Z',
    nullable: false,
    type: String,
    format: 'date-time',
  })
  updatedAt!: Date;

  constructor(evaluation: ResponseEvalutionVehicleInput) {
    this.id = evaluation.id!;
    this.vehicleId = evaluation.vehicleId!;
    this.riskLevel = evaluation.riskLevel ?? null;
    this.recommendation = evaluation.recommendation ?? null;
    this.isComplete = evaluation.isComplete ?? false;
    this.lastCalculatedAt = evaluation.lastCalculatedAt ?? null;
    this.createdAt = evaluation.createdAt!;
    this.updatedAt = evaluation.updatedAt!;

    this.desiredProfitMarginPercent =
      evaluation.desiredProfitMarginPercent === null
        ? null
        : Number(evaluation.desiredProfitMarginPercent);

    this.safetyMarginPercent =
      evaluation.safetyMarginPercent === null
        ? null
        : Number(evaluation.safetyMarginPercent);

    this.maxRecommendedBid =
      evaluation.maxRecommendedBid === null
        ? null
        : Number(evaluation.maxRecommendedBid);

    this.estimatedFinalCost =
      evaluation.estimatedFinalCost === null
        ? null
        : Number(evaluation.estimatedFinalCost);

    this.estimatedProfit =
      evaluation.estimatedProfit === null
        ? null
        : Number(evaluation.estimatedProfit);
  }
}
