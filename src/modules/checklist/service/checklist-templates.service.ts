import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChecklistTemplateDto } from '../dto/create-checklist-template.dto';
import { UpdateChecklistDto } from '../dto/update-checklist.dto';
import { PrismaService } from 'src/database/prisma.service';
import { ResponseChecklistTemplateDto } from '../dto/response-checklist-template.dto';

@Injectable()
export class ChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateChecklistTemplateDto,
  ): Promise<ResponseChecklistTemplateDto> {
    return await this.prisma.checklistTemplate.create({
      data: { ...dto },
    });
  }

  async findAll(): Promise<ResponseChecklistTemplateDto[]> {
    return this.prisma.checklistTemplate.findMany();
  }

  async findOne(id: string): Promise<ResponseChecklistTemplateDto> {
    const checklistTemplate = await this.prisma.checklistTemplate.findUnique({
      where: { id },
    });

    if (!checklistTemplate) {
      throw new NotFoundException('Checklist template not found');
    }

    return checklistTemplate;
  }

  async update(
    id: string,
    updateChecklistDto: UpdateChecklistDto,
  ): Promise<ResponseChecklistTemplateDto> {
    try {
      return await this.prisma.checklistTemplate.update({
        where: { id },
        data: { ...updateChecklistDto },
      });
    } catch (error) {
      throw new NotFoundException('Checklist template not found');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.checklistTemplate.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException('Checklist template not found');
    }
  }
}
