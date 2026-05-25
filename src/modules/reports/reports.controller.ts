import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Authenticated } from 'src/common/decorators/authenticated.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RequirePlan } from 'src/common/decorators/require-plan.decorator';
import { PlanGuard } from 'src/common/guards/plan.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { VehicleOwnerGuard } from '../vehicles/guards/vehicle-owner/vehicle-owner.guard';
import { VehicleReportResponseDto } from './dto/vehicle-report-response.dto';
import { ReportsService } from './reports.service';
import { SubscriptionPlan } from '../../../generated/prisma/enums';

@ApiTags('Reports / Relatórios')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Gera relatório JSON de um veículo.' })
  @ApiOkResponse({ type: VehicleReportResponseDto })
  @ApiForbiddenResponse({
    description: 'Plano premium necessário para acessar este recurso.',
  })
  @RequirePlan(SubscriptionPlan.PREMIUM)
  @Authenticated()
  @UseGuards(VehicleOwnerGuard, PlanGuard)
  @Get('vehicles/:vehicleId')
  getVehicleReport(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<VehicleReportResponseDto> {
    return this.reportsService.getVehicleReport(user.sub, vehicleId, user.role);
  }
}
