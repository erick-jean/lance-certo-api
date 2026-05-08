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
  desiredProfitMargin: Prisma.Decimal | null;
  safetyMargin: Prisma.Decimal | null;
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
  | 'desiredProfitMargin'
  | 'safetyMargin'
  | 'maxRecommendedBid'
  | 'estimatedFinalCost'
  | 'estimatedProfit'
>;

export class ResponseVehicleEvaluationDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  id!: string;

  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  vehicleId!: string;

  @ApiProperty({ nullable: true })
  estimatedRepairCost!: number | null;

  @ApiProperty({ nullable: true })
  auctionFees!: number | null;

  @ApiProperty({ nullable: true })
  documentationCost!: number | null;

  @ApiProperty({ nullable: true })
  transportCost!: number | null;

  @ApiProperty({ nullable: true })
  inspectionCost!: number | null;

  @ApiProperty({ nullable: true })
  desiredProfitMargin!: number | null;

  @ApiProperty({ nullable: true })
  safetyMargin!: number | null;

  @ApiProperty({ nullable: true })
  maxRecommendedBid!: number | null;

  @ApiProperty({ nullable: true })
  estimatedFinalCost!: number | null;

  @ApiProperty({ nullable: true })
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

    this.desiredProfitMargin = evaluation.desiredProfitMargin
      ? Number(evaluation.desiredProfitMargin)
      : null;

    this.safetyMargin = evaluation.safetyMargin
      ? Number(evaluation.safetyMargin)
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
