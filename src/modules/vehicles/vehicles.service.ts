import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ownerScope } from 'src/common/access/owner-scope.util';
import {
  isRecordNotFoundError,
  isSerializableConflict,
} from 'src/common/errors/prisma-error.util';
import { calculateVehicleFinancialSummary } from 'src/common/finance/vehicle-finance.util';
import {
  PLAN_LIMITS,
  resolveEffectivePlan,
} from 'src/common/plans/plan-limits';
import { UserRole } from 'src/common/enums/user-role.enum';
import { normalizePlate } from 'src/common/utils/plate.util';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import {
  SubscriptionPlan,
  VehicleStatus,
} from '../../../generated/prisma/enums';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FindVehiclesQueryDto } from './dto/find-vehicles-query.dto';
import { PaginatedVehicleResponseDto } from './dto/paginated-vehicles-response.dto';
import { PurchaseVehicleDto } from './dto/purchase-vehicle.dto';
import { ResponseVehicleDto } from './dto/response-vehicle.dto';
import { SellVehicleDto } from './dto/sell-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFinancialSummaryDto } from './dto/vehicle-financial-summary.dto';
import { VehicleImagesService } from './images/vehicle-images.service';

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
  type: true,
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
  purchasePrice: true,
  purchasedAt: true,
  soldPrice: true,
  soldAt: true,
  damageType: true,
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

type VehiclePrismaClient = Pick<PrismaService, 'user' | 'vehicle'>;

const SERIALIZABLE_TRANSACTION_MAX_RETRIES = 3;

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicleImagesService: VehicleImagesService,
  ) {}

  async createVehicleForUser(
    userId: string,
    createVehicleDto: CreateVehicleDto,
    userRole?: UserRole,
  ): Promise<ResponseVehicleDto> {
    const vehicle = await this.runSerializableTransaction(async (tx) => {
      await this.ensurePremiumForFinancialVehicleData(
        tx,
        userId,
        createVehicleDto,
        userRole,
      );
      await this.ensureFreePlanVehicleLimit(tx, userId);

      return tx.vehicle.create({
        data: {
          ...this.buildVehicleWritableData(createVehicleDto),
          userId,
        },
      });
    });

    return new ResponseVehicleDto(vehicle);
  }

  async listUserVehicles(
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

  async findVehicleForUser(
    userId: string,
    vehicleId: string,
    userRole?: UserRole,
  ): Promise<ResponseVehicleDto> {
    const vehicle = await this.findVehicleForUserOrAdminOrThrow(
      userId,
      vehicleId,
      userRole,
    );

    return new ResponseVehicleDto(vehicle);
  }

  async updateVehicleForUser(
    userId: string,
    vehicleId: string,
    updateVehicleDto: UpdateVehicleDto,
    userRole?: UserRole,
  ): Promise<ResponseVehicleDto> {
    await this.ensurePremiumForFinancialVehicleData(
      this.prisma,
      userId,
      updateVehicleDto,
      userRole,
    );

    const vehicle = await this.findVehicleForUserOrAdminOrThrow(
      userId,
      vehicleId,
      userRole,
    );

    try {
      const updatedVehicle = await this.prisma.vehicle.update({
        where: {
          id: vehicle.id,
        },
        data: this.buildVehicleWritableData(updateVehicleDto),
      });

      return new ResponseVehicleDto(updatedVehicle);
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException('Veículo não encontrado.');
      }

      throw error;
    }
  }

  async deleteVehicleForUser(
    userId: string,
    vehicleId: string,
    userRole?: UserRole,
  ): Promise<void> {
    /**
     * Image files live outside the database, so filenames are loaded before
     * deleting the vehicle record.
     */
    const vehicle = await this.prisma.vehicle.findFirst({
      where: this.buildVehicleOwnerWhere(userId, vehicleId, userRole),
      select: {
        id: true,
        images: {
          select: {
            filename: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado.');
    }

    const deleteResult = await this.prisma.vehicle.deleteMany({
      where: {
        id: vehicle.id,
      },
    });

    if (deleteResult.count === 0) {
      throw new NotFoundException('Veículo não encontrado.');
    }

    await this.vehicleImagesService.removeFiles(
      vehicle.images.map((image) => image.filename),
    );
  }

  async markVehicleAsPurchased(
    userId: string,
    vehicleId: string,
    dto: PurchaseVehicleDto,
    userRole?: UserRole,
  ): Promise<ResponseVehicleDto> {
    await this.ensurePremiumAccess(this.prisma, userId, userRole);
    const vehicle = await this.findVehicleForUserOrAdminOrThrow(
      userId,
      vehicleId,
      userRole,
    );

    if (dto.purchasePrice <= 0) {
      throw new BadRequestException(
        'Valor do arremate precisa ser maior que zero.',
      );
    }

    if (vehicle.status === VehicleStatus.SOLD) {
      throw new BadRequestException(
        'Veiculo vendido nao pode voltar para arrematado.',
      );
    }

    if (vehicle.status === VehicleStatus.REJECTED) {
      throw new BadRequestException(
        'Veiculo rejeitado nao pode ser marcado como arrematado.',
      );
    }

    const updatedVehicle = await this.prisma.vehicle.update({
      where: {
        id: vehicle.id,
      },
      data: {
        purchasePrice: dto.purchasePrice,
        purchasedAt: dto.purchasedAt ? new Date(dto.purchasedAt) : new Date(),
        status: VehicleStatus.PURCHASED,
      },
    });

    return new ResponseVehicleDto(updatedVehicle);
  }

  async markVehicleAsSold(
    userId: string,
    vehicleId: string,
    dto: SellVehicleDto,
    userRole?: UserRole,
  ): Promise<ResponseVehicleDto> {
    await this.ensurePremiumAccess(this.prisma, userId, userRole);
    const vehicle = await this.findVehicleForUserOrAdminOrThrow(
      userId,
      vehicleId,
      userRole,
    );

    const soldAt = dto.soldAt ? new Date(dto.soldAt) : new Date();

    if (dto.soldPrice <= 0) {
      throw new BadRequestException(
        'Valor de venda precisa ser maior que zero.',
      );
    }

    if (vehicle.purchasedAt && soldAt < vehicle.purchasedAt) {
      throw new BadRequestException(
        'Data da venda nao pode ser anterior a data do arremate.',
      );
    }

    if (vehicle.status !== VehicleStatus.PURCHASED) {
      throw new BadRequestException(
        'Veículo precisa estar arrematado antes de ser vendido.',
      );
    }

    const updatedVehicle = await this.prisma.vehicle.update({
      where: {
        id: vehicle.id,
      },
      data: {
        soldPrice: dto.soldPrice,
        soldAt,
        status: VehicleStatus.SOLD,
      },
    });

    return new ResponseVehicleDto(updatedVehicle);
  }

  async getVehicleFinancialSummary(
    userId: string,
    vehicleId: string,
    userRole?: UserRole,
  ): Promise<VehicleFinancialSummaryDto> {
    await this.ensurePremiumAccess(this.prisma, userId, userRole);

    const vehicle = await this.prisma.vehicle.findFirst({
      where: this.buildVehicleOwnerWhere(userId, vehicleId, userRole),
      include: {
        evaluation: {
          include: {
            evaluationExpenses: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado.');
    }

    return calculateVehicleFinancialSummary(vehicle);
  }

  private toResponse(vehicle: VehicleListItem): ResponseVehicleDto {
    return new ResponseVehicleDto(vehicle);
  }

  private async findVehicleForUserOrAdminOrThrow(
    userId: string,
    vehicleId: string,
    userRole?: UserRole,
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: this.buildVehicleOwnerWhere(userId, vehicleId, userRole),
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado.');
    }

    return vehicle;
  }

  private async ensurePremiumAccess(
    prisma: Pick<PrismaService, 'user'>,
    userId: string,
    userRole?: UserRole,
  ): Promise<void> {
    if (userRole === UserRole.ADMIN) {
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        planStatus: true,
        planExpiresAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (resolveEffectivePlan(user) !== SubscriptionPlan.PREMIUM) {
      throw new ForbiddenException(
        'Plano premium necessário para acessar este recurso.',
      );
    }
  }

  private async ensurePremiumForFinancialVehicleData(
    prisma: Pick<PrismaService, 'user'>,
    userId: string,
    dto: CreateVehicleDto | UpdateVehicleDto,
    userRole?: UserRole,
  ): Promise<void> {
    const hasFinancialData =
      dto.purchasePrice !== undefined ||
      dto.purchasedAt !== undefined ||
      dto.soldPrice !== undefined ||
      dto.soldAt !== undefined ||
      dto.status === VehicleStatus.PURCHASED ||
      dto.status === VehicleStatus.SOLD;

    if (hasFinancialData) {
      await this.ensurePremiumAccess(prisma, userId, userRole);
    }
  }

  private async ensureFreePlanVehicleLimit(
    prisma: VehiclePrismaClient,
    userId: string,
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        planStatus: true,
        planExpiresAt: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (
      user.role === UserRole.ADMIN ||
      resolveEffectivePlan(user) === SubscriptionPlan.PREMIUM
    ) {
      return;
    }

    const currentVehiclesCount = await prisma.vehicle.count({
      where: { userId },
    });
    const maxVehicles = PLAN_LIMITS[SubscriptionPlan.FREE].maxVehicles;

    if (currentVehiclesCount >= maxVehicles) {
      throw new ForbiddenException(
        `Plano grátis permite até ${maxVehicles} veículos. Faça upgrade para o Premium para cadastrar veículos ilimitados.`,
      );
    }
  }

  private buildVehicleOwnerWhere(
    userId: string,
    vehicleId: string,
    userRole?: UserRole,
  ): Prisma.VehicleWhereInput {
    return {
      id: vehicleId,
      ...ownerScope(userId, userRole),
    };
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
        ? { plate: { contains: normalizePlate(query.plate) } }
        : {}),
    };
  }

  private buildVehicleWritableData(
    dto: CreateVehicleDto | UpdateVehicleDto,
  ): VehicleWritableData {
    return {
      plate:
        dto.plate === undefined || dto.plate === null
          ? dto.plate
          : normalizePlate(dto.plate),
      brand: dto.brand,
      model: dto.model,
      version: dto.version,
      yearManufacture: dto.yearManufacture,
      yearModel: dto.yearModel,
      color: dto.color,
      fuelType: dto.fuelType,
      transmission: dto.transmission,
      type: dto.type,
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
      purchasePrice: dto.purchasePrice,
      purchasedAt: dto.purchasedAt,
      soldPrice: dto.soldPrice,
      soldAt: dto.soldAt,
      damageType: dto.damageType,
      status: dto.status,
      notes: dto.notes,
    };
  }

  private async runSerializableTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (
      let attempt = 1;
      attempt <= SERIALIZABLE_TRANSACTION_MAX_RETRIES;
      attempt++
    ) {
      try {
        // Serializable isolation prevents concurrent free-plan requests from bypassing the vehicle limit.
        return await this.prisma.$transaction(callback, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (
          !isSerializableConflict(error) ||
          attempt === SERIALIZABLE_TRANSACTION_MAX_RETRIES
        ) {
          throw error;
        }
      }
    }

    throw new ConflictException('Tente novamente em alguns instantes.');
  }
}
