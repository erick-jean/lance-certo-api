import { Injectable } from '@nestjs/common';
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

  findAll() {
    return `This action returns all checklist`;
  }

  findOne(id: number) {
    return `This action returns a #${id} checklist`;
  }

  update(id: number, updateChecklistDto: UpdateChecklistDto) {
    return `This action updates a #${id} checklist`;
  }

  remove(id: number) {
    return `This action removes a #${id} checklist`;
  }
}
