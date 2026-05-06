import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FindVehiclesQueryDto } from './dto/find-vehicles-query.dto';
import { PaginatedVeichleResponseDto } from './dto/paginated-vehicles-response.dto';
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
      data: { ...createVehicleDto, userId },
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
  ): Promise<PaginatedVeichleResponseDto> {
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
      ...(query.plate
        ? { plate: { contains: query.plate.trim().toUpperCase() } }
        : {}),
    };
  }
}
