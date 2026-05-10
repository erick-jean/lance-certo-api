import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from 'src/database/prisma.service';
import { VehicleImageResponseDto } from './dto/response-vehicle-image.dto';

const VEHICLE_IMAGE_UPLOAD_DIR = join(process.cwd(), 'uploads', 'vehicles');
const VEHICLE_IMAGE_PUBLIC_PATH = '/uploads/vehicles';
const MAX_VEHICLE_IMAGES = 10;
const vehicleImageExtensionsByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const;

@Injectable()
export class VehicleImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
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

  async findAll(
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

  async remove(
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

    await this.removeFiles([image.filename]);
  }

  async removeFiles(filenames: string[]): Promise<void> {
    await Promise.allSettled(
      filenames.map((filename) =>
        unlink(join(VEHICLE_IMAGE_UPLOAD_DIR, filename)),
      ),
    );
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
}
