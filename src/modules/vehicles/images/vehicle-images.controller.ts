import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { AuthGuard } from '../../auth/auth.guard';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import { VehicleOwnerGuard } from '../guards/vehicle-owner/vehicle-owner.guard';
import { VehicleImageResponseDto } from './dto/response-vehicle-image.dto';
import { VehicleImagesService } from './vehicle-images.service';

@ApiTags('Vehicle Images / Imagens do veiculo')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTooManyRequestsResponse({ description: 'Too many requests' })
@UseGuards(AuthGuard, VehicleOwnerGuard)
@Controller('vehicles/:vehicleId/images')
export class VehicleImagesController {
  constructor(private readonly vehicleImagesService: VehicleImagesService) {}

  @ApiOperation({ summary: 'Lista imagens do veiculo.' })
  @ApiOkResponse({ type: VehicleImageResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<VehicleImageResponseDto[]> {
    return this.vehicleImagesService.listUserVehicleImages(
      req.user.sub,
      vehicleId,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Adiciona imagens do veiculo.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiCreatedResponse({ type: VehicleImageResponseDto, isArray: true })
  @ApiBadRequestResponse({ description: 'Invalid image upload' })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 120_000 } })
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      fileFilter: (_req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Somente imagens JPEG, PNG e WEBP são permitidas.',
            ),
            false,
          );
        }

        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  create(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<VehicleImageResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Envie pelo menos uma imagem.');
    }

    return this.vehicleImagesService.addImagesToUserVehicle(
      req.user.sub,
      vehicleId,
      files,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Remove imagem do veiculo.' })
  @ApiNoContentResponse({ description: 'Vehicle image removed successfully' })
  @ApiNotFoundResponse({ description: 'Vehicle image not found' })
  @Delete(':imageId')
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
  ): Promise<void> {
    return this.vehicleImagesService.deleteUserVehicleImage(
      req.user.sub,
      vehicleId,
      imageId,
      req.user.role,
    );
  }
}
