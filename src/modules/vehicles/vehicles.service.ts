import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FindVehiclesQueryDto } from './dto/find-vehicles-query.dto';
import { PaginatedVehicleResponseDto } from './dto/paginated-vehicles-response.dto';
import { ResponseVehicleDto } from './dto/response-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

const vehiclesListSelect = {
  id: true,
  userId: true,
  plate: true,
  brand: true,
  model: true,
  version: true,
  yearManufacture: true,
  yearModel: true,
  color: true,
  fuelType: true,
  transmission: true,
  mileage: true,
  fipeCode: true,
  fipeValue: true,
  marketValue: true,
  auctioneer: true,
  auctionType: true,
  sourceUrl: true,
  eventDate: true,
  city: true,
  state: true,
  yardAddress: true,
  auctionInitialBid: true,
  auctionCurrentBid: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.VehicleSelect;

type VehicleListItem = Prisma.VehicleGetPayload<{
  select: typeof vehiclesListSelect;
}>;

type VehicleWritableData = Omit<
  Prisma.VehicleUncheckedCreateInput,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    createVehicleDto: CreateVehicleDto,
  ): Promise<ResponseVehicleDto> {
    /**
     * Checks if a vehicle with the same plate
     * already exists for the user.
     */
    // if (createVehicleDto.plate) {
    //   const vehicleAlreadyExists = await this.prisma.vehicle.findFirst({
    //     where: {
    //       userId,
    //       plate: createVehicleDto.plate,
    //     },
    //   });

    //   if (vehicleAlreadyExists) {
    //      throw new ConflictException(
    //       'Já existe um veículo cadastrado com esta placa.',
    //     );
    //   }
    // }
    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...this.toVehicleWritableData(createVehicleDto),
        userId,
      },
    });
    return new ResponseVehicleDto(vehicle);
  }

  /**
   * Returns paginated vehicles owned by a user.
   *
   * The `userId` filter is always enforced server-side so users cannot list
   * vehicles that belong to another account.
   */
  async findAll(
    userId: string,
    query: FindVehiclesQueryDto,
  ): Promise<PaginatedVehicleResponseDto> {
    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;
    const where = this.buildFindAllWhere(userId, query);

    const [totalItems, vehicles] = await this.prisma.$transaction([
      this.prisma.vehicle.count({ where }),
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        select: vehiclesListSelect,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: vehicles.map((vehicle) => this.toResponse(vehicle)),
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(
    userId: string,
    vehicleId: string,
  ): Promise<ResponseVehicleDto> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { userId, id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }
    return new ResponseVehicleDto(vehicle);
  }

  async update(
    userId: string,
    vehicleId: string,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<ResponseVehicleDto> {
    try {
      const updatedVehicle = await this.prisma.vehicle.update({
        where: {
          id: vehicleId,
          userId,
        },
        data: this.toVehicleWritableData(updateVehicleDto),
      });

      return new ResponseVehicleDto(updatedVehicle);
    } catch (error) {
      if (this.isRecordNotFoundError(error)) {
        throw new NotFoundException('Vehicle not found.');
      }

      throw error;
    }
  }

  async remove(userId: string, vehicleId: string): Promise<void> {
    const result = await this.prisma.vehicle.deleteMany({
      where: {
        id: vehicleId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Vehicle not found.');
    }
  }

  private toResponse(vehicle: VehicleListItem): ResponseVehicleDto {
    return new ResponseVehicleDto(vehicle);
  }

  private buildFindAllWhere(
    userId: string,
    query: FindVehiclesQueryDto,
  ): Prisma.VehicleWhereInput {
    return {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.brand
        ? { brand: { contains: query.brand, mode: 'insensitive' } }
        : {}),
      ...(query.model
        ? { model: { contains: query.model, mode: 'insensitive' } }
        : {}),
      ...(query.plate ? { plate: { contains: query.plate } } : {}),
    };
  }

  private toVehicleWritableData(
    dto: CreateVehicleDto | UpdateVehicleDto,
  ): VehicleWritableData {
    return {
      plate: dto.plate,
      brand: dto.brand,
      model: dto.model,
      version: dto.version,
      yearManufacture: dto.yearManufacture,
      yearModel: dto.yearModel,
      color: dto.color,
      fuelType: dto.fuelType,
      transmission: dto.transmission,
      mileage: dto.mileage,
      fipeCode: dto.fipeCode,
      fipeValue: dto.fipeValue,
      marketValue: dto.marketValue,
      auctioneer: dto.auctioneer,
      auctionType: dto.auctionType,
      sourceUrl: dto.sourceUrl,
      eventDate: dto.eventDate,
      city: dto.city,
      state: dto.state,
      yardAddress: dto.yardAddress,
      auctionInitialBid: dto.auctionInitialBid,
      auctionCurrentBid: dto.auctionCurrentBid,
      status: dto.status,
      notes: dto.notes,
    };
  }

  private isRecordNotFoundError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }
}
