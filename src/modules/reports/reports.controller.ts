import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequirePlan } from 'src/common/decorators/require-plan.decorator';
import { PlanGuard } from 'src/common/guards/plan.guard';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { VehicleOwnerGuard } from '../vehicles/guards/vehicle-owner/vehicle-owner.guard';
import { VehicleReportResponseDto } from './dto/vehicle-report-response.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports / Relatórios')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Gera relatório JSON de um veículo.' })
  @ApiOkResponse({ type: VehicleReportResponseDto })
  @ApiForbiddenResponse({
    description: 'Plano premium necessário para acessar este recurso.',
  })
  @RequirePlan('premium')
  @UseGuards(AuthGuard, VehicleOwnerGuard, PlanGuard)
  @Get('vehicles/:vehicleId')
  getVehicleReport(
    @Req() request: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<VehicleReportResponseDto> {
    return this.reportsService.getVehicleReport(
      request.user.sub,
      vehicleId,
      request.user.role,
    );
  }
}
