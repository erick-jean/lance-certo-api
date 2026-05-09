import { ApiProperty } from '@nestjs/swagger';
import {
  EvaluationRecommendation,
  EvaluationRiskLevel,
} from '../../../../generated/prisma/enums';
import { Prisma } from '../../../../generated/prisma/client';

type ResponseVehicleEvaluationInput = {
  estimatedRepairCost: Prisma.Decimal | null;
  auctionFees: Prisma.Decimal | null;
  documentationCost: Prisma.Decimal | null;
  transportCost: Prisma.Decimal | null;
  inspectionCost: Prisma.Decimal | null;
  desiredProfitMarginPercent: Prisma.Decimal | null;
  safetyMarginPercent: Prisma.Decimal | null;
  maxRecommendedBid: Prisma.Decimal | null;
  estimatedFinalCost: Prisma.Decimal | null;
  estimatedProfit: Prisma.Decimal | null;
} & Omit<
  Partial<ResponseVehicleEvaluationDto>,
  | 'estimatedRepairCost'
  | 'auctionFees'
  | 'documentationCost'
  | 'transportCost'
  | 'inspectionCost'
  | 'desiredProfitMarginPercent'
  | 'safetyMarginPercent'
  | 'maxRecommendedBid'
  | 'estimatedFinalCost'
  | 'estimatedProfit'
>;

export class ResponseVehicleEvaluationDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  id!: string;

  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  vehicleId!: string;

  @ApiProperty({ example: 8500, nullable: true })
  estimatedRepairCost!: number | null;

  @ApiProperty({ example: 5, nullable: true })
  auctionFees!: number | null;

  @ApiProperty({ example: 1200, nullable: true })
  documentationCost!: number | null;

  @ApiProperty({ example: 1800, nullable: true })
  transportCost!: number | null;

  @ApiProperty({ example: 500, nullable: true })
  inspectionCost!: number | null;

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

  constructor(evaluation: ResponseVehicleEvaluationInput) {
    Object.assign(this, evaluation);

    this.estimatedRepairCost = evaluation.estimatedRepairCost
      ? Number(evaluation.estimatedRepairCost)
      : null;

    this.auctionFees = evaluation.auctionFees
      ? Number(evaluation.auctionFees)
      : null;

    this.documentationCost = evaluation.documentationCost
      ? Number(evaluation.documentationCost)
      : null;

    this.transportCost = evaluation.transportCost
      ? Number(evaluation.transportCost)
      : null;

    this.inspectionCost = evaluation.inspectionCost
      ? Number(evaluation.inspectionCost)
      : null;

    this.desiredProfitMarginPercent = evaluation.desiredProfitMarginPercent
      ? Number(evaluation.desiredProfitMarginPercent)
      : null;

    this.safetyMarginPercent = evaluation.safetyMarginPercent
      ? Number(evaluation.safetyMarginPercent)
      : null;

    this.maxRecommendedBid = evaluation.maxRecommendedBid
      ? Number(evaluation.maxRecommendedBid)
      : null;

    this.estimatedFinalCost = evaluation.estimatedFinalCost
      ? Number(evaluation.estimatedFinalCost)
      : null;

    this.estimatedProfit = evaluation.estimatedProfit
      ? Number(evaluation.estimatedProfit)
      : null;
  }
}
