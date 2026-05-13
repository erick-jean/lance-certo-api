import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PLAN_LIMITS,
  resolveEffectivePlan,
} from 'src/common/plans/plan-limits';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { VehicleStatus } from '../../../generated/prisma/enums';
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

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicleImagesService: VehicleImagesService,
  ) {}

  async createVehicleForUser(
    userId: string,
    createVehicleDto: CreateVehicleDto,
    userRole?: string,
  ): Promise<ResponseVehicleDto> {
    await this.ensureVehicleLimit(userId);
    await this.ensurePremiumForFinancialVehicleData(
      userId,
      createVehicleDto,
      userRole,
    );

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
   * The user scope is enforced server-side so users cannot list vehicles from
   * another account.
   */
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

  async findUserVehicleById(
    userId: string,
    vehicleId: string,
  ): Promise<ResponseVehicleDto> {
    /**
     * Scope the vehicle lookup by userId to prevent cross-user access.
     */
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { userId, id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }
    return new ResponseVehicleDto(vehicle);
  }

  async updateUserVehicle(
    userId: string,
    vehicleId: string,
    updateVehicleDto: UpdateVehicleDto,
    userRole?: string,
  ): Promise<ResponseVehicleDto> {
    await this.ensurePremiumForFinancialVehicleData(
      userId,
      updateVehicleDto,
      userRole,
    );

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

  async deleteUserVehicle(userId: string, vehicleId: string): Promise<void> {
    /**
     * Image files live outside the database, so filenames are loaded before
     * deleting the vehicle record.
     */
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        userId,
      },
      select: {
        images: {
          select: {
            filename: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    const deleteResult = await this.prisma.vehicle.deleteMany({
      where: {
        id: vehicleId,
        userId,
      },
    });

    if (deleteResult.count === 0) {
      throw new NotFoundException('Vehicle not found.');
    }

    await this.vehicleImagesService.removeFiles(
      vehicle.images.map((image) => image.filename),
    );
  }

  async markVehicleAsPurchased(
    userId: string,
    vehicleId: string,
    dto: PurchaseVehicleDto,
    userRole?: string,
  ): Promise<ResponseVehicleDto> {
    await this.ensurePremiumAccess(userId, userRole);
    await this.findVehicleForUserOrAdminOrThrow(userId, vehicleId, userRole);

    const vehicle = await this.prisma.vehicle.update({
      where: {
        id: vehicleId,
      },
      data: {
        purchasePrice: dto.purchasePrice,
        purchasedAt: dto.purchasedAt ? new Date(dto.purchasedAt) : new Date(),
        status: VehicleStatus.PURCHASED,
      },
    });

    return new ResponseVehicleDto(vehicle);
  }

  async markVehicleAsSold(
    userId: string,
    vehicleId: string,
    dto: SellVehicleDto,
    userRole?: string,
  ): Promise<ResponseVehicleDto> {
    await this.ensurePremiumAccess(userId, userRole);
    const vehicle = await this.findVehicleForUserOrAdminOrThrow(
      userId,
      vehicleId,
      userRole,
    );

    if (vehicle.purchasePrice === null) {
      throw new BadRequestException(
        'Veículo precisa estar arrematado antes de ser vendido.',
      );
    }

    const updatedVehicle = await this.prisma.vehicle.update({
      where: {
        id: vehicleId,
      },
      data: {
        soldPrice: dto.soldPrice,
        soldAt: dto.soldAt ? new Date(dto.soldAt) : new Date(),
        status: VehicleStatus.SOLD,
      },
    });

    return new ResponseVehicleDto(updatedVehicle);
  }

  async getVehicleFinancialSummary(
    userId: string,
    vehicleId: string,
    userRole?: string,
  ): Promise<VehicleFinancialSummaryDto> {
    await this.ensurePremiumAccess(userId, userRole);

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
      throw new NotFoundException('Vehicle not found.');
    }

    return this.buildFinancialSummary(vehicle);
  }

  private toResponse(vehicle: VehicleListItem): ResponseVehicleDto {
    return new ResponseVehicleDto(vehicle);
  }

  private async findVehicleForUserOrAdminOrThrow(
    userId: string,
    vehicleId: string,
    userRole?: string,
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: this.buildVehicleOwnerWhere(userId, vehicleId, userRole),
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    return vehicle;
  }

  private async ensurePremiumAccess(
    userId: string,
    userRole?: string,
  ): Promise<void> {
    if (userRole === 'admin') {
      return;
    }

    const user = await this.prisma.user.findUnique({
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

    if (resolveEffectivePlan(user) !== 'premium') {
      throw new ForbiddenException(
        'Plano premium necessário para acessar este recurso.',
      );
    }
  }

  private async ensurePremiumForFinancialVehicleData(
    userId: string,
    dto: CreateVehicleDto | UpdateVehicleDto,
    userRole?: string,
  ): Promise<void> {
    const hasFinancialData =
      dto.purchasePrice !== undefined ||
      dto.purchasedAt !== undefined ||
      dto.soldPrice !== undefined ||
      dto.soldAt !== undefined ||
      dto.status === VehicleStatus.PURCHASED ||
      dto.status === VehicleStatus.SOLD;

    if (hasFinancialData) {
      await this.ensurePremiumAccess(userId, userRole);
    }
  }

  private async ensureVehicleLimit(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
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

    if (user.role === 'admin' || resolveEffectivePlan(user) === 'premium') {
      return;
    }

    const currentVehiclesCount = await this.prisma.vehicle.count({
      where: { userId },
    });
    const maxVehicles = PLAN_LIMITS.free.maxVehicles;

    if (currentVehiclesCount >= maxVehicles) {
      throw new ForbiddenException(
        `Plano grátis permite até ${maxVehicles} veículos. Faça upgrade para o Premium para cadastrar veículos ilimitados.`,
      );
    }
  }

  private buildVehicleOwnerWhere(
    userId: string,
    vehicleId: string,
    userRole?: string,
  ): Prisma.VehicleWhereInput {
    return {
      id: vehicleId,
      ...(userRole === 'admin' ? {} : { userId }),
    };
  }

  private buildFinancialSummary(vehicle: {
    id: string;
    purchasePrice: Prisma.Decimal | null;
    purchasedAt: Date | null;
    soldPrice: Prisma.Decimal | null;
    soldAt: Date | null;
    evaluation?: {
      evaluationExpenses: {
        amount: Prisma.Decimal;
      }[];
    } | null;
  }): VehicleFinancialSummaryDto {
    const purchasePrice = this.toNullableNumber(vehicle.purchasePrice);
    const soldPrice = this.toNullableNumber(vehicle.soldPrice);
    const totalExpenses = vehicle.evaluation
      ? vehicle.evaluation.evaluationExpenses.reduce(
          (sum, expense) => sum + this.toNumber(expense.amount),
          0,
        )
      : 0;
    const totalInvestment =
      this.toNumber(vehicle.purchasePrice) + totalExpenses;
    const grossProfit = soldPrice === null ? null : soldPrice - totalInvestment;
    const profitMarginPercent =
      grossProfit === null || totalInvestment <= 0
        ? null
        : (grossProfit / totalInvestment) * 100;

    return {
      vehicleId: vehicle.id,
      purchasePrice,
      purchasedAt: vehicle.purchasedAt,
      totalExpenses: this.roundMoney(totalExpenses),
      totalInvestment: this.roundMoney(totalInvestment),
      soldPrice,
      soldAt: vehicle.soldAt,
      grossProfit: grossProfit === null ? null : this.roundMoney(grossProfit),
      profitMarginPercent:
        profitMarginPercent === null
          ? null
          : Number(profitMarginPercent.toFixed(2)),
      isSold: soldPrice !== null && vehicle.soldAt !== null,
    };
  }

  private toNumber(value: Prisma.Decimal | number | string | null | undefined) {
    return value === null || value === undefined ? 0 : Number(value);
  }

  private toNullableNumber(
    value: Prisma.Decimal | number | string | null | undefined,
  ) {
    return value === null || value === undefined ? null : Number(value);
  }

  private roundMoney(value: number): number {
    return Number(value.toFixed(2));
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

  private isRecordNotFoundError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }
}
