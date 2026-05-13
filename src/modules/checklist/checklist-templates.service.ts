import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { CreateChecklistTemplateItemDto } from './dto/create-checklist-template-item.dto';
import { ResponseChecklistTemplateItemDto } from './dto/response-checklist-template-item.dto';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { ResponseChecklistTemplateDto } from './dto/response-checklist-template.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { UpdateChecklistTemplateItemDto } from './dto/update-checklist-template-item.dto';

type ChecklistTemplateItemCreateData = Omit<
  Prisma.ChecklistTemplateItemUncheckedCreateInput,
  'templateId'
>;

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

  async listChecklistTemplates(): Promise<ResponseChecklistTemplateDto[]> {
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

  async findChecklistTemplateById(
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

  async deleteChecklistTemplate(id: string): Promise<void> {
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

  async createChecklistTemplateItem(
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
        data: {
          templateId,
          ...this.toChecklistTemplateItemCreateData(dto),
        },
      });

    return new ResponseChecklistTemplateItemDto(checklistTemplateItem);
  }

  async findChecklistTemplateItemById(
    id: string,
  ): Promise<ResponseChecklistTemplateItemDto> {
    const itemChecklist = await this.prisma.checklistTemplateItem.findUnique({
      where: { id },
    });

    if (!itemChecklist) {
      throw new NotFoundException('Item Checklist template not found');
    }

    return new ResponseChecklistTemplateItemDto(itemChecklist);
  }

  async listChecklistTemplateItems(
    templateId: string,
  ): Promise<ResponseChecklistTemplateItemDto[]> {
    const checklistTemplate = await this.prisma.checklistTemplate.findUnique({
      where: { id: templateId },
      select: { id: true },
    });

    if (!checklistTemplate) {
      throw new NotFoundException('Checklist template not found');
    }

    const itemsChecklistTemplate =
      await this.prisma.checklistTemplateItem.findMany({
        where: { templateId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      });

    return itemsChecklistTemplate.map(
      (item) => new ResponseChecklistTemplateItemDto(item),
    );
  }

  async updateChecklistTemplateItem(
    itemId: string,
    dto: UpdateChecklistTemplateItemDto,
  ): Promise<ResponseChecklistTemplateItemDto> {
    try {
      const itemChecklist = await this.prisma.checklistTemplateItem.update({
        where: { id: itemId },
        data: this.toChecklistTemplateItemUpdateData(dto),
      });

      return new ResponseChecklistTemplateItemDto(itemChecklist);
    } catch (error) {
      if (!this.isRecordNotFoundError(error)) {
        throw error;
      }

      throw new NotFoundException('Item Checklist template not found');
    }
  }

  async deleteChecklistTemplateItem(itemId: string): Promise<void> {
    try {
      await this.prisma.checklistTemplateItem.delete({
        where: { id: itemId },
      });
    } catch (error) {
      if (!this.isRecordNotFoundError(error)) {
        throw error;
      }

      throw new NotFoundException('Item Checklist template not found');
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
      isActive: dto.isActive,
    };
  }

  private toChecklistTemplateUpdateData(
    dto: UpdateChecklistDto,
  ): Prisma.ChecklistTemplateUncheckedUpdateInput {
    return {
      name: dto.name,
      vehicleType: dto.vehicleType,
      isActive: dto.isActive,
    };
  }

  private toChecklistTemplateItemCreateData(
    dto: CreateChecklistTemplateItemDto,
  ): ChecklistTemplateItemCreateData {
    /**
     * Item templates become the source data copied into vehicle evaluations.
     * Keep the write list explicit so clients cannot set ids or timestamps.
     */
    return {
      category: dto.category,
      name: dto.name,
      question: dto.question,
      defaultEstimatedCost: dto.defaultEstimatedCost,
      severity: dto.severity,
      requiresQuantity: dto.requiresQuantity,
      isRequired: dto.isRequired,
      order: dto.order,
    };
  }

  private toChecklistTemplateItemUpdateData(
    dto: UpdateChecklistTemplateItemDto,
  ): Prisma.ChecklistTemplateItemUncheckedUpdateInput {
    return {
      category: dto.category,
      name: dto.name,
      question: dto.question,
      defaultEstimatedCost: dto.defaultEstimatedCost,
      severity: dto.severity,
      requiresQuantity: dto.requiresQuantity,
      isRequired: dto.isRequired,
      order: dto.order,
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
