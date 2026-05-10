import { PartialType } from '@nestjs/swagger';
import { CreateChecklistTemplateDto } from './create-checklist-template.dto';

export class UpdateChecklistDto extends PartialType(
  CreateChecklistTemplateDto,
) {}
