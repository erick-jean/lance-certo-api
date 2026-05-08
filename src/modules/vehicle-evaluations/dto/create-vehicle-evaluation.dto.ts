import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  EvaluationRecommendation,
  EvaluationRiskLevel,
} from 'generated/prisma/enums';

export class CreateVehicleEvaluationDto {
  /**
   * Estimated repair cost.
   */
  @ApiPropertyOptional({
    example: 8500,
    nullable: true,
  })
  estimatedRepairCost?: number | null;

  /**
   * Auction fees.
   */
  @ApiPropertyOptional({
    example: 2500,
    nullable: true,
  })
  auctionFees?: number | null;

  /**
   * Estimated documentation cost.
   */
  @ApiPropertyOptional({
    example: 1200,
    nullable: true,
  })
  documentationCost?: number | null;

  /**
   * Transport cost.
   */
  @ApiPropertyOptional({
    example: 1800,
    nullable: true,
  })
  transportCost?: number | null;

  /**
   * Inspection cost.
   */
  @ApiPropertyOptional({
    example: 500,
    nullable: true,
  })
  inspectionCost?: number | null;

  /**
   * Desired profit margin.
   */
  @ApiPropertyOptional({
    example: 15000,
    nullable: true,
  })
  desiredProfitMargin?: number | null;

  /**
   * Safety margin.
   */
  @ApiPropertyOptional({
    example: 5000,
    nullable: true,
  })
  safetyMargin?: number | null;

  /**
   * Maximum recommended bid.
   */
  @ApiPropertyOptional({
    example: 82000,
    nullable: true,
  })
  maxRecommendedBid?: number | null;

  /**
   * Estimated final cost.
   */
  @ApiPropertyOptional({
    example: 98000,
    nullable: true,
  })
  estimatedFinalCost?: number | null;

  /**
   * Estimated profit.
   */
  @ApiPropertyOptional({
    example: 12000,
    nullable: true,
  })
  estimatedProfit?: number | null;

  /**
   * Evaluation risk level.
   */
  @ApiPropertyOptional({
    enum: EvaluationRiskLevel,
    example: EvaluationRiskLevel.MEDIUM,
    nullable: true,
  })
  riskLevel?: EvaluationRiskLevel | null;

  /**
   * Evaluation recommendation.
   */
  @ApiPropertyOptional({
    enum: EvaluationRecommendation,
    example: EvaluationRecommendation.CAUTION,
    nullable: true,
  })
  recommendation?: EvaluationRecommendation | null;

  /**
   * Indicates whether the evaluation is complete.
   */
  @ApiPropertyOptional({
    example: true,
  })
  isComplete?: boolean;

  /**
   * Last evaluation recalculation date.
   */
  @ApiPropertyOptional({
    example: '2026-05-08T15:30:00.000Z',
    nullable: true,
  })
  lastCalculatedAt?: Date | null;
}