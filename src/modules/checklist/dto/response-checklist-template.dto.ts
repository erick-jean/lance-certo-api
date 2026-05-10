import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from 'generated/prisma/enums';

export class ResponseChecklistTemplateDto {
  @ApiProperty({
    example: 'c1a2b3d4-uuid',
    description: 'ID único do template',
  })
  id!: string;

  @ApiProperty({
    example: 'Checklist padrão carro',
    description: 'Nome do template',
  })
  name!: string;

  @ApiProperty({
    enum: VehicleType,
    example: VehicleType.CAR,
    description: 'Tipo de veículo do checklist',
  })
  vehicleType!: VehicleType;

  @ApiProperty({
    example: true,
    description: 'Indica se o template está ativo',
  })
  isActive!: boolean;

  @ApiProperty({
    example: 15,
    description: 'Quantidade de itens no checklist',
    required: false,
  })
  totalItems?: number;

  @ApiProperty({
    example: '2026-05-06T17:32:44.757Z',
    description: 'Data de criação',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-05-06T17:32:44.757Z',
    description: 'Data da última atualização',
  })
  updatedAt!: Date;
}