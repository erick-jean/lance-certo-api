DO $$
BEGIN
  IF to_regclass('"evalution_vehicle"') IS NULL
    AND to_regclass('"vehicle_evaluations"') IS NOT NULL THEN
    ALTER TABLE "vehicle_evaluations" RENAME TO "evalution_vehicle";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'vehicle_evaluations_pkey'
  ) THEN
    ALTER INDEX "vehicle_evaluations_pkey" RENAME TO "evalution_vehicle_pkey";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'vehicle_evaluations_vehicleId_key'
  ) THEN
    ALTER INDEX "vehicle_evaluations_vehicleId_key"
      RENAME TO "evalution_vehicle_vehicleId_key";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'vehicle_evaluations_vehicleId_idx'
  ) THEN
    ALTER INDEX "vehicle_evaluations_vehicleId_idx"
      RENAME TO "evalution_vehicle_vehicleId_idx";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'vehicle_evaluations_riskLevel_idx'
  ) THEN
    ALTER INDEX "vehicle_evaluations_riskLevel_idx"
      RENAME TO "evalution_vehicle_riskLevel_idx";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'vehicle_evaluations_recommendation_idx'
  ) THEN
    ALTER INDEX "vehicle_evaluations_recommendation_idx"
      RENAME TO "evalution_vehicle_recommendation_idx";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'vehicle_evaluations_vehicleId_fkey'
  ) THEN
    ALTER TABLE "evalution_vehicle"
      RENAME CONSTRAINT "vehicle_evaluations_vehicleId_fkey"
      TO "evalution_vehicle_vehicleId_fkey";
  END IF;
END $$;
