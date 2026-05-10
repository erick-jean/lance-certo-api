import { PartialType } from '@nestjs/swagger';
import { CreateChecklistDto } from './create-checklist-template.dto';

export class UpdateChecklistDto extends PartialType(CreateChecklistDto) {}
