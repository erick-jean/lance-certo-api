import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChecklistTemplateDto } from '../dto/create-checklist-template.dto';
import { UpdateChecklistDto } from '../dto/update-checklist.dto';
import { PrismaService } from 'src/database/prisma.service';
import { ResponseChecklistTemplateDto } from '../dto/response-checklist-template.dto';
import { Prisma } from '../../../../generated/prisma/client';

@Injectable()
export class ChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateChecklistTemplateDto,
  ): Promise<ResponseChecklistTemplateDto> {
    const checklistTemplate = await this.prisma.checklistTemplate.create({
      data: this.toChecklistTemplateCreateData(dto),
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return new ResponseChecklistTemplateDto(checklistTemplate);
  }

  async findAll(): Promise<ResponseChecklistTemplateDto[]> {
    const checklistTemplates = await this.prisma.checklistTemplate.findMany({
      /**
       * `_count.items` lets the API expose how many default items a template
       * has without loading every checklist item on listing endpoints.
       */
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return checklistTemplates.map(
      (checklistTemplate) =>
        new ResponseChecklistTemplateDto(checklistTemplate),
    );
  }

  async findOne(id: string): Promise<ResponseChecklistTemplateDto> {
    const checklistTemplate = await this.prisma.checklistTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!checklistTemplate) {
      throw new NotFoundException('Checklist template not found');
    }

    return new ResponseChecklistTemplateDto(checklistTemplate);
  }

  async update(
    id: string,
    updateChecklistDto: UpdateChecklistDto,
  ): Promise<ResponseChecklistTemplateDto> {
    try {
      const checklistTemplate = await this.prisma.checklistTemplate.update({
        where: { id },
        data: this.toChecklistTemplateUpdateData(updateChecklistDto),
        include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      });

      return new ResponseChecklistTemplateDto(checklistTemplate);
    } catch (error) {
      if (!this.isRecordNotFoundError(error)) {
        throw error;
      }

      throw new NotFoundException('Checklist template not found');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.checklistTemplate.delete({
        where: { id },
      });
    } catch (error) {
      if (!this.isRecordNotFoundError(error)) {
        throw error;
      }

      throw new NotFoundException('Checklist template not found');
    }
  }

  private toChecklistTemplateCreateData(
    dto: CreateChecklistTemplateDto,
  ): Prisma.ChecklistTemplateUncheckedCreateInput {
    /**
     * Keep writable fields explicit to avoid mass assignment if the DTO grows
     * or if validation is accidentally relaxed in the future.
     */
    return {
      name: dto.name,
      vehicleType: dto.vehicleType,
    };
  }

  private toChecklistTemplateUpdateData(
    dto: UpdateChecklistDto,
  ): Prisma.ChecklistTemplateUncheckedUpdateInput {
    return {
      name: dto.name,
      vehicleType: dto.vehicleType,
    };
  }

  private isRecordNotFoundError(error: unknown): boolean {
    /**
     * Prisma throws P2025 for update/delete operations when the target record
     * does not exist. Mapping it here keeps HTTP responses consistent.
     */
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    );
  }
}
