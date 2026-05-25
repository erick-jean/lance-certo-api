import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { ownerScope } from 'src/common/access/owner-scope.util';
import { UserRole } from 'src/common/enums/user-role.enum';
import { PrismaService } from 'src/database/prisma.service';
import { StorageService } from 'src/modules/storage/storage.service';
import { VehicleImageResponseDto } from './dto/response-vehicle-image.dto';

const VEHICLE_IMAGE_STORAGE_PREFIX = 'vehicles';
const MAX_VEHICLE_IMAGES = 10;
const MAX_IMAGE_WIDTH = 6000;
const MAX_IMAGE_HEIGHT = 6000;
const OPTIMIZED_IMAGE_WIDTH = 1920;
const vehicleImageExtensionsByMimeType = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
} as const;

@Injectable()
export class VehicleImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async addImagesToUserVehicle(
    userId: string,
    vehicleId: string,
    files: Express.Multer.File[],
    userRole?: UserRole,
  ): Promise<VehicleImageResponseDto[]> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        ...ownerScope(userId, userRole),
      },
      select: {
        _count: {
          select: {
            images: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado.');
    }

    if (vehicle._count.images + files.length > MAX_VEHICLE_IMAGES) {
      throw new BadRequestException(
        `Cada veículo pode ter no máximo ${MAX_VEHICLE_IMAGES} imagens.`,
      );
    }

    const imageFiles = await Promise.all(
      files.map((file) => this.prepareVehicleImage(file)),
    );
    const uploadedKeys: string[] = [];

    try {
      /**
       * Files are uploaded before database records; any failure rolls back the
       * storage side effects tracked in uploadedKeys.
       */
      for (const imageFile of imageFiles) {
        await this.storageService.uploadFile({
          key: imageFile.storageKey,
          buffer: imageFile.buffer,
          contentType: imageFile.mimetype,
        });
        uploadedKeys.push(imageFile.storageKey);
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
      await Promise.allSettled(
        uploadedKeys.map((key) => this.storageService.deleteFile(key)),
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Não foi possível salvar imagens.',
      );
    }
  }

  async listUserVehicleImages(
    userId: string,
    vehicleId: string,
    userRole?: UserRole,
  ): Promise<VehicleImageResponseDto[]> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        ...ownerScope(userId, userRole),
      },
      select: {
        images: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado.');
    }

    return vehicle.images.map((image) => new VehicleImageResponseDto(image));
  }

  async deleteUserVehicleImage(
    userId: string,
    vehicleId: string,
    imageId: string,
    userRole?: UserRole,
  ): Promise<void> {
    const image = await this.prisma.vehicleImage.findFirst({
      where: {
        id: imageId,
        vehicleId,
        vehicle: ownerScope(userId, userRole),
      },
      select: {
        id: true,
        filename: true,
      },
    });

    if (!image) {
      throw new NotFoundException('Imagem do veículo não encontrada.');
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
        this.storageService.deleteFile(
          this.getVehicleImageStorageKey(filename),
        ),
      ),
    );
  }

  private async prepareVehicleImage(file: Express.Multer.File): Promise<{
    buffer: Buffer;
    filename: string;
    mimetype: 'image/webp';
    size: number;
    storageKey: string;
    url: string;
  }> {
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Arquivo de imagem inválido.');
    }

    if (!this.isAllowedVehicleImageMimeType(file.mimetype)) {
      throw new BadRequestException(
        'Somente imagens JPEG, PNG e WEBP são permitidas.',
      );
    }

    /**
     * MIME type alone is client-controlled, so the file signature is validated
     * before persisting the upload.
     */
    if (!this.hasValidImageSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException('Conteúdo da imagem inválido.');
    }

    const optimizedBuffer = await this.optimizeVehicleImage(file.buffer);
    const filename = `${randomUUID()}.webp`;

    return {
      buffer: optimizedBuffer,
      filename,
      mimetype: 'image/webp',
      size: optimizedBuffer.length,
      storageKey: this.getVehicleImageStorageKey(filename),
      url: this.storageService.getPublicUrl(
        this.getVehicleImageStorageKey(filename),
      ),
    };
  }

  private getVehicleImageStorageKey(filename: string): string {
    return `${VEHICLE_IMAGE_STORAGE_PREFIX}/${filename}`;
  }

  private async optimizeVehicleImage(buffer: Buffer): Promise<Buffer> {
    try {
      const image = sharp(buffer, {
        failOn: 'warning',
        limitInputPixels: MAX_IMAGE_WIDTH * MAX_IMAGE_HEIGHT,
      });
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new BadRequestException('Dimensoes da imagem invalidas.');
      }

      if (
        metadata.width > MAX_IMAGE_WIDTH ||
        metadata.height > MAX_IMAGE_HEIGHT
      ) {
        throw new BadRequestException(
          `Imagem excede o limite de ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}px.`,
        );
      }

      // Re-encoding to WebP strips metadata/EXIF and normalizes user uploads.
      return image
        .rotate()
        .resize({
          width: OPTIMIZED_IMAGE_WIDTH,
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Conteudo da imagem invalido.');
    }
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
