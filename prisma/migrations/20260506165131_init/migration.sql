-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'ETHANOL', 'FLEX', 'DIESEL', 'ELECTRIC', 'HYBRID', 'GNV');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT', 'AUTOMATED');

-- CreateEnum
CREATE TYPE "AuctionType" AS ENUM ('JUDICIAL', 'EXTRAJUDICIAL', 'BANK', 'INSURANCE', 'DEALERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('PENDING', 'ANALYZING', 'APPROVED', 'REJECTED', 'PURCHASED', 'SOLD');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plate" VARCHAR(10) NOT NULL,
    "brand" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "version" VARCHAR(150),
    "yearManufacture" INTEGER NOT NULL,
    "yearModel" INTEGER NOT NULL,
    "color" VARCHAR(50),
    "fuelType" "FuelType",
    "transmission" "TransmissionType",
    "mileage" INTEGER,
    "fipeCode" VARCHAR(20),
    "fipeValue" DECIMAL(12,2),
    "marketValue" DECIMAL(12,2),
    "auctioneer" VARCHAR(150),
    "auctionType" "AuctionType",
    "sourceUrl" TEXT,
    "eventDate" TIMESTAMP(3),
    "city" VARCHAR(100),
    "state" VARCHAR(2),
    "yardAddress" TEXT,
    "auctionInitialBid" DECIMAL(12,2),
    "auctionCurrentBid" DECIMAL(12,2),
    "status" "VehicleStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
