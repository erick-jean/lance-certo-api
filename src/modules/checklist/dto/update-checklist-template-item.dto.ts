import { PartialType } from '@nestjs/swagger';
import { CreateChecklistTemplateItemDto } from './create-checklist-template-item.dto';

export class UpdateChecklistTemplateItemDto extends PartialType(
  CreateChecklistTemplateItemDto,
) {}
