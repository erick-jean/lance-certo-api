import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FindVehiclesQueryDto } from './dto/find-vehicles-query.dto';
import { PaginatedVeichleResponseDto } from './dto/paginated-vehicles-response.dto';
import { ResponseVehicleDto } from './dto/response-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { PrismaService } from 'src/database/prisma.service';

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

// Constantes para paginação
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

type VehicleListItem = Prisma.VehicleGetPayload<{
  select: typeof vehiclesListSelect;
}>;

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  create(createVehicleDto: CreateVehicleDto) {
    void createVehicleDto;
    return 'This action adds a new vehicle';
  }

  /**
   * Returns paginated vehicles owned by a user.
   *
   * The `userId` filter is always enforced server-side so users cannot list
   * vehicles that belong to another account.
   */
  async findAll(
    page: number,
    limit: number,
    userId: string,
    query: FindVehiclesQueryDto,
  ): Promise<PaginatedVeichleResponseDto> {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { userId: userId },
      select: query,
    });

    if (!vehicles) {
      return new NotFoundException('Vehicles not found');
    }

    const sanitizedPage = Math.max(DEFAULT_PAGE, page);
    const sanitizedLimit = Math.min(Math.max(DEFAULT_LIMIT, limit), MAX_LIMIT);
    const skip = (sanitizedPage - 1) * sanitizedLimit;

    const [totalItems, users] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: sanitizedLimit,
        select: vehiclesListSelect,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / sanitizedLimit);

    return {
      data: users.map((user) => this.toResponse(user)),
      meta: {
        page: sanitizedPage,
        limit: sanitizedLimit,
        totalItems,
        totalPages,
        hasNextPage: sanitizedPage < totalPages,
        hasPreviousPage: sanitizedPage > 1,
      },
    };
  }

  findOne(id: string) {
    return `This action returns a #${id} vehicle`;
  }

  update(id: string, updateVehicleDto: UpdateVehicleDto) {
    void updateVehicleDto;
    return `This action updates a #${id} vehicle`;
  }

  remove(id: string) {
    return `This action removes a #${id} vehicle`;
  }

  private toResponse(vehicle: VehicleListItem): ResponseVehicleDto {
    return {
      id: vehicle.id,
      userId: vehicle.userId,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      version: vehicle.version,
      yearManufacture: vehicle.yearManufacture,
      yearModel: vehicle.yearModel,
      color: vehicle.color,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      mileage: vehicle.mileage,
      fipeCode: vehicle.fipeCode,
      fipeValue: vehicle.fipeValue,
      marketValue: vehicle.marketValue,
      auctioneer: vehicle.auctioneer,
      auctionType: vehicle.auctionType,
      sourceUrl: vehicle.sourceUrl,
      eventDate: vehicle.eventDate,
      city: vehicle.city,
      state: vehicle.state,
      yardAddress: vehicle.yardAddress,
      auctionInitialBid: vehicle.auctionInitialBid,
      auctionCurrentBid: vehicle.auctionCurrentBid,
      status: vehicle.status,
      notes: vehicle.notes,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }
}
