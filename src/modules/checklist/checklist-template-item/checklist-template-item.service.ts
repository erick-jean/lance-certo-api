import { Injectable } from '@nestjs/common';
import { CreateChecklistTemplateItemDto } from './dto/create-checklist-template-item.dto';
import { UpdateChecklistTemplateItemDto } from './dto/update-checklist-template-item.dto';
import { PrismaService } from 'src/database/prisma.service';
import { ResponseChecklistTemplateItemDto } from './dto/response-checklist-template-item.dto';

@Injectable()
export class ChecklistTemplateItemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateChecklistTemplateItemDto,
  ): Promise<ResponseChecklistTemplateItemDto> {
    const checklistTemplateItem =
      await this.prisma.checklistTemplateItem.create({
        data: { ...dto },
      });

    return new ResponseChecklistTemplateItemDto({
      ...checklistTemplateItem,
      defaultEstimatedCost:
        checklistTemplateItem.defaultEstimatedCost?.toNumber() ?? null,
    });
  }

  findAll() {
    return `This action returns all checklistTemplateItem`;
  }

  findOne(id: number) {
    return `This action returns a #${id} checklistTemplateItem`;
  }

  update(
    id: number,
    updateChecklistTemplateItemDto: UpdateChecklistTemplateItemDto,
  ) {
    return `This action updates a #${id} checklistTemplateItem`;
  }

  remove(id: number) {
    return `This action removes a #${id} checklistTemplateItem`;
  }
}
