import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from '../../../../../generated/prisma/enums';

type ChecklistTemplateResponseInput = {
  id: string;
  name: string;
  vehicleType: VehicleType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    items: number;
  };
};

export class ResponseChecklistTemplateDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  id!: string;

  @ApiProperty({ example: 'Checklist padrão carro' })
  name!: string;

  @ApiProperty({
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  vehicleType!: VehicleType;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({
    example: 15,
    required: false,
  })
  totalItems?: number;

  @ApiProperty({ example: '2026-05-06T17:32:44.757Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-06T17:32:44.757Z' })
  updatedAt!: Date;

  constructor(checklistTemplate: ChecklistTemplateResponseInput) {
    this.id = checklistTemplate.id;
    this.name = checklistTemplate.name;
    this.vehicleType = checklistTemplate.vehicleType;
    this.isActive = checklistTemplate.isActive;
    this.totalItems = checklistTemplate._count?.items;
    this.createdAt = checklistTemplate.createdAt;
    this.updatedAt = checklistTemplate.updatedAt;
  }
}
