import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FindVehiclesQueryDto } from './dto/find-vehicles-query.dto';
import { PaginatedVehicleResponseDto } from './dto/paginated-vehicles-response.dto';
import { ResponseVehicleDto } from './dto/response-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleImageResponseDto } from './dto/response-vehicle-image.dto';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

const VEHICLE_IMAGE_UPLOAD_DIR = join(process.cwd(), 'uploads', 'vehicles');
const VEHICLE_IMAGE_PUBLIC_PATH = '/uploads/vehicles';
const MAX_VEHICLE_IMAGES = 10;
const vehicleImageExtensionsByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const;

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

  async addImages(
    userId: string,
    vehicleId: string,
    files: Express.Multer.File[],
  ): Promise<VehicleImageResponseDto[]> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { userId, id: vehicleId },
      select: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    if (vehicle._count.images + files.length > MAX_VEHICLE_IMAGES) {
      throw new BadRequestException(
        `A vehicle can have at most ${MAX_VEHICLE_IMAGES} images.`,
      );
    }

    const imageFiles = files.map((file) => this.prepareVehicleImage(file));
    const writtenFilePaths: string[] = [];

    try {
      await mkdir(VEHICLE_IMAGE_UPLOAD_DIR, { recursive: true });

      for (const imageFile of imageFiles) {
        await writeFile(imageFile.path, imageFile.buffer, { flag: 'wx' });
        writtenFilePaths.push(imageFile.path);
      }

      const images = await this.prisma.vehicleImage.createManyAndReturn({
        data: imageFiles.map((file) => ({
          vehicleId,
          url: file.url,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
        })),
      });

      return images.map((image) => new VehicleImageResponseDto(image));
    } catch (error) {
      await Promise.allSettled(writtenFilePaths.map((path) => unlink(path)));

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Could not save images.');
    }
  }

  async findImages(
    userId: string,
    vehicleId: string,
  ): Promise<VehicleImageResponseDto[]> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { userId, id: vehicleId },
      select: {
        images: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    return vehicle.images.map((image) => new VehicleImageResponseDto(image));
  }

  async removeImage(
    userId: string,
    vehicleId: string,
    imageId: string,
  ): Promise<void> {
    const image = await this.prisma.vehicleImage.findFirst({
      where: {
        id: imageId,
        vehicleId,
        vehicle: {
          userId,
        },
      },
      select: {
        id: true,
        filename: true,
      },
    });

    if (!image) {
      throw new NotFoundException('Vehicle image not found.');
    }

    await this.prisma.vehicleImage.delete({
      where: {
        id: image.id,
      },
    });

    await Promise.allSettled([
      unlink(join(VEHICLE_IMAGE_UPLOAD_DIR, image.filename)),
    ]);
  }

  private prepareVehicleImage(file: Express.Multer.File): {
    buffer: Buffer;
    filename: string;
    mimetype: keyof typeof vehicleImageExtensionsByMimeType;
    path: string;
    size: number;
    url: string;
  } {
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Invalid image file.');
    }

    if (!this.isAllowedVehicleImageMimeType(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG and WEBP images are allowed.',
      );
    }

    if (!this.hasValidImageSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException('Invalid image content.');
    }

    const filename = `${randomUUID()}${
      vehicleImageExtensionsByMimeType[file.mimetype]
    }`;

    return {
      buffer: file.buffer,
      filename,
      mimetype: file.mimetype,
      path: join(VEHICLE_IMAGE_UPLOAD_DIR, filename),
      size: file.size,
      url: `${VEHICLE_IMAGE_PUBLIC_PATH}/${filename}`,
    };
  }

  private isAllowedVehicleImageMimeType(
    mimetype: string,
  ): mimetype is keyof typeof vehicleImageExtensionsByMimeType {
    return mimetype in vehicleImageExtensionsByMimeType;
  }

  private hasValidImageSignature(
    buffer: Buffer,
    mimetype: keyof typeof vehicleImageExtensionsByMimeType,
  ): boolean {
    if (mimetype === 'image/jpeg') {
      return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8;
    }

    if (mimetype === 'image/png') {
      return buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }

    return (
      buffer.length > 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  async remove(userId: string, vehicleId: string): Promise<void> {
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

    const result = await this.prisma.vehicle.deleteMany({
      where: {
        id: vehicleId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Vehicle not found.');
    }

    await Promise.allSettled(
      vehicle.images.map((image) =>
        unlink(join(VEHICLE_IMAGE_UPLOAD_DIR, image.filename)),
      ),
    );
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
