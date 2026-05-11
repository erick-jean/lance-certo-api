import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { PrismaService } from 'src/database/prisma.service';
import { ResponseChecklistTemplateDto } from './dto/response-checklist-template.dto';
import { Prisma } from '../../../../generated/prisma/client';
import { CreateChecklistTemplateItemDto } from './dto/create-checklist-template-item.dto';
import { ResponseChecklistTemplateItemDto } from './dto/response-checklist-template-item.dto';

@Injectable()
export class ChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  async createChecklistTemplate(
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

  async findAllChecklistTemplate(): Promise<ResponseChecklistTemplateDto[]> {
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

  async findOneChecklistTemplate(
    id: string,
  ): Promise<ResponseChecklistTemplateDto> {
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

  async updateChecklistTemplate(
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

  async removeChecklistTemplate(id: string): Promise<void> {
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

  async createItemChecklist(
    templateId: string,
    dto: CreateChecklistTemplateItemDto,
  ): Promise<ResponseChecklistTemplateItemDto> {
    const checklistTemplate = await this.prisma.checklistTemplate.findUnique({
      where: { id: templateId },
    });

    if (!checklistTemplate) {
      throw new NotFoundException('Checklist template not found');
    }

    const checklistTemplateItem =
      await this.prisma.checklistTemplateItem.create({
        data: { ...dto, templateId },
      });

    return new ResponseChecklistTemplateItemDto({
      ...checklistTemplateItem,
      defaultEstimatedCost:
        checklistTemplateItem.defaultEstimatedCost?.toNumber() ?? null,
    });
  }

  async findOneItemChecklist(
    id: string,
  ): Promise<ResponseChecklistTemplateItemDto> {
    const itemChecklist = await this.prisma.checklistTemplateItem.findUnique({
      where: { id },
    });

    if (!itemChecklist) {
      throw new NotFoundException('Item Checklist template not found');
    }

    return new ResponseChecklistTemplateItemDto({
      ...itemChecklist,
      defaultEstimatedCost:
        itemChecklist.defaultEstimatedCost?.toNumber() ?? null,
    });
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
