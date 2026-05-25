import { BadRequestException } from '@nestjs/common';
import { VehicleImagesService } from './vehicle-images.service';

describe('VehicleImagesService', () => {
  const makeService = () => {
    const prisma = {
      vehicle: {
        findFirst: jest.fn().mockResolvedValue({
          _count: {
            images: 0,
          },
        }),
      },
      vehicleImage: {
        createManyAndReturn: jest.fn(),
      },
    };
    const storageService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      getPublicUrl: jest.fn((key: string) => `/uploads/${key}`),
    };
    const service = new VehicleImagesService(prisma as never, storageService);

    return { service, storageService };
  };

  it('rejeita upload com assinatura de arquivo inválida', async () => {
    const { service, storageService } = makeService();
    const invalidPng = {
      buffer: Buffer.from('not-a-real-png'),
      mimetype: 'image/png',
      originalname: 'fake.png',
      size: 14,
    } as Express.Multer.File;

    await expect(
      service.addImagesToUserVehicle('user-1', 'vehicle-1', [invalidPng]),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storageService.uploadFile).not.toHaveBeenCalled();
  });

  it('rejeita SVG como imagem de veículo', async () => {
    const { service, storageService } = makeService();
    const svg = {
      buffer: Buffer.from('<svg></svg>'),
      mimetype: 'image/svg+xml',
      originalname: 'image.svg',
      size: 11,
    } as Express.Multer.File;

    await expect(
      service.addImagesToUserVehicle('user-1', 'vehicle-1', [svg]),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storageService.uploadFile).not.toHaveBeenCalled();
  });
  it('rejeita imagem com extensao incompatível', async () => {
    const { service, storageService } = makeService();
    const jpegWithInvalidExtension = {
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xdb]),
      mimetype: 'image/jpeg',
      originalname: 'image.txt',
      size: 4,
    } as Express.Multer.File;

    await expect(
      service.addImagesToUserVehicle('user-1', 'vehicle-1', [
        jpegWithInvalidExtension,
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(storageService.uploadFile).not.toHaveBeenCalled();
  });
});
