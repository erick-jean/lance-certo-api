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
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthGuard } from '../../auth/auth.guard';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { VehicleOwnerGuard } from '../guards/vehicle-owner/vehicle-owner.guard';
import { VehicleImageResponseDto } from './dto/response-vehicle-image.dto';
import { VehicleImagesService } from './vehicle-images.service';

@ApiTags('Vehicle Images / Imagens do veículo')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Não autorizado.' })
@ApiTooManyRequestsResponse({ description: 'Muitas requisições.' })
@UseGuards(AuthGuard, VehicleOwnerGuard)
@Controller('vehicles/:vehicleId/images')
export class VehicleImagesController {
  constructor(private readonly vehicleImagesService: VehicleImagesService) {}

  @ApiOperation({ summary: 'Lista imagens do veículo.' })
  @ApiOkResponse({ type: VehicleImageResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado.' })
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<VehicleImageResponseDto[]> {
    return this.vehicleImagesService.listUserVehicleImages(
      user.sub,
      vehicleId,
      user.role,
    );
  }

  @ApiOperation({ summary: 'Adiciona imagens do veículo.' })
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
  @ApiBadRequestResponse({ description: 'Upload de imagem inválido.' })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado.' })
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
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<VehicleImageResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Envie pelo menos uma imagem.');
    }

    return this.vehicleImagesService.addImagesToUserVehicle(
      user.sub,
      vehicleId,
      files,
      user.role,
    );
  }

  @ApiOperation({ summary: 'Remove imagem do veículo.' })
  @ApiNoContentResponse({ description: 'Imagem removida com sucesso.' })
  @ApiNotFoundResponse({ description: 'Imagem do veículo não encontrada.' })
  @Delete(':imageId')
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
  ): Promise<void> {
    return this.vehicleImagesService.deleteUserVehicleImage(
      user.sub,
      vehicleId,
      imageId,
      user.role,
    );
  }
}
