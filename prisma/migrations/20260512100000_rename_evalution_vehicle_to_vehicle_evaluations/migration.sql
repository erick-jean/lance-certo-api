DO $$
BEGIN
  IF to_regclass('"vehicle_evaluations"') IS NULL
    AND to_regclass('"evalution_vehicle"') IS NOT NULL THEN
    ALTER TABLE "evalution_vehicle" RENAME TO "vehicle_evaluations";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'evalution_vehicle_pkey'
  ) THEN
    ALTER INDEX "evalution_vehicle_pkey" RENAME TO "vehicle_evaluations_pkey";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'evalution_vehicle_vehicleId_key'
  ) THEN
    ALTER INDEX "evalution_vehicle_vehicleId_key"
      RENAME TO "vehicle_evaluations_vehicleId_key";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'evalution_vehicle_vehicleId_idx'
  ) THEN
    ALTER INDEX "evalution_vehicle_vehicleId_idx"
      RENAME TO "vehicle_evaluations_vehicleId_idx";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'evalution_vehicle_riskLevel_idx'
  ) THEN
    ALTER INDEX "evalution_vehicle_riskLevel_idx"
      RENAME TO "vehicle_evaluations_riskLevel_idx";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'evalution_vehicle_recommendation_idx'
  ) THEN
    ALTER INDEX "evalution_vehicle_recommendation_idx"
      RENAME TO "vehicle_evaluations_recommendation_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'evalution_vehicle_vehicleId_fkey'
  ) THEN
    ALTER TABLE "vehicle_evaluations"
      RENAME CONSTRAINT "evalution_vehicle_vehicleId_fkey"
      TO "vehicle_evaluations_vehicleId_fkey";
  END IF;
END $$;
