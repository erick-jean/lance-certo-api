import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FindVehiclesQueryDto } from './dto/find-vehicles-query.dto';
import { PaginatedVehicleResponseDto } from './dto/paginated-vehicles-response.dto';
import { ResponseVehicleDto } from './dto/response-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';
import { Throttle } from '@nestjs/throttler';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { VehicleImageResponseDto } from './dto/response-vehicle-image.dto';
import { VehicleOwnerGuard } from './guards/vehicle-owner/vehicle-owner.guard';

@ApiTags('Vehicles / Veículos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTooManyRequestsResponse({ description: 'Too many requests' })
@UseGuards(AuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /**
   * Lists vehicles owned by the authenticated user with pagination and filters.
   */
  @ApiOperation({ summary: 'Lista veiculos do usuario autenticado' })
  @ApiOkResponse({
    description: 'Lista paginada de veiculos retornada com sucesso',
    type: PaginatedVehicleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid pagination parameters',
  })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: FindVehiclesQueryDto,
  ): Promise<PaginatedVehicleResponseDto> {
    return this.vehiclesService.findAll(req.user.sub, query);
  }

  /**
   * Creates a new vehicle for the authenticated user.
   *
   * This endpoint allows the authenticated user to register
   * a new vehicle in the system.
   */
  @ApiOperation({ summary: 'Cadastra novo veículo.' })
  @ApiCreatedResponse({ type: ResponseVehicleDto })
  @ApiBadRequestResponse({ description: 'Invalid vehicle payload' })
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  create(
    @Body() createVehicleDto: CreateVehicleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ResponseVehicleDto> {
    return this.vehiclesService.create(req.user.sub, createVehicleDto);
  }

  /**
   * Busca um veículo específico pelo ID, garantindo que o usuário autenticado tenha acesso a ele.
   */
  @ApiOperation({ summary: 'Busca veículo específico.' })
  @ApiOkResponse({ type: ResponseVehicleDto })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  @Get(':vehicleId')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @UseGuards(VehicleOwnerGuard)
  findOne(
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ResponseVehicleDto> {
    return this.vehiclesService.findOne(req.user.sub, vehicleId);
  }

  @ApiOperation({ summary: 'Atualiza veículo.' })
  @ApiOkResponse({ type: ResponseVehicleDto })
  @ApiBadRequestResponse({ description: 'Invalid vehicle payload' })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 120_000 } })
  @Patch(':vehicleId')
  @UseGuards(VehicleOwnerGuard)
  update(
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ResponseVehicleDto> {
    return this.vehiclesService.update(
      req.user.sub,
      vehicleId,
      updateVehicleDto,
    );
  }

  @ApiOperation({ summary: 'Remove veículo.' })
  @ApiNoContentResponse({ description: 'Vehicle removed successfully' })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  @Delete(':vehicleId')
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @UseGuards(VehicleOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<void> {
    return this.vehiclesService.remove(req.user.sub, vehicleId);
  }

  @ApiOperation({ summary: 'Lista imagens do veiculo.' })
  @ApiOkResponse({ type: VehicleImageResponseDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  @Get(':vehicleId/images')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @UseGuards(VehicleOwnerGuard)
  findImages(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<VehicleImageResponseDto[]> {
    return this.vehiclesService.findImages(req.user.sub, vehicleId);
  }

  @ApiOperation({ summary: 'Remove imagem do veiculo.' })
  @ApiNoContentResponse({ description: 'Vehicle image removed successfully' })
  @ApiNotFoundResponse({ description: 'Vehicle image not found' })
  @Delete(':vehicleId/images/:imageId')
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @UseGuards(VehicleOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  removeImage(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
  ): Promise<void> {
    return this.vehiclesService.removeImage(req.user.sub, vehicleId, imageId);
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
  @Post(':vehicleId/images')
  @ApiCreatedResponse({ type: VehicleImageResponseDto, isArray: true })
  @ApiBadRequestResponse({ description: 'Invalid image upload' })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 120_000 } })
  @UseGuards(VehicleOwnerGuard)
  @UseInterceptors(
    /**
     * Intercepts multipart/form-data requests
     * and processes uploaded image files.
     *
     * Configuration:
     * - Field name: "images"
     * - Maximum files allowed: 6
     */
    FilesInterceptor('images', 6, {
      storage: memoryStorage(),

      /**
       * Validates uploaded file types.
       *
       * Only allows:
       * - image/jpeg
       * - image/png
       * - image/webp
       */
      fileFilter: (req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Only JPEG, PNG and WEBP images are allowed.',
            ),
            false,
          );
        }

        callback(null, true);
      },

      /**
       * Maximum allowed file size:
       * 5 MB per file.
       */
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  addImages(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @UploadedFiles()
    files: Express.Multer.File[],
  ): Promise<VehicleImageResponseDto[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image is required.');
    }
    return this.vehiclesService.addImages(req.user.sub, vehicleId, files);
  }
}
