import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
import { DashboardService } from './dashboard.service';
import { DashboardFinancialResponseDto } from './dto/dashboard-financial-response.dto';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Não autorizado.' })
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiOperation({ summary: 'Busca resumo geral do dashboard.' })
  @ApiOkResponse({ type: DashboardSummaryResponseDto })
  @Get('summary')
  getSummary(
    @Req() request: AuthenticatedRequest,
  ): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getSummary(request.user.sub);
  }

  @ApiOperation({ summary: 'Busca resumo financeiro do dashboard.' })
  @ApiOkResponse({ type: DashboardFinancialResponseDto })
  @ApiForbiddenResponse({
    description: 'Plano premium necessário para acessar este recurso.',
  })
  @RequirePlan('premium')
  @UseGuards(PlanGuard)
  @Get('financial')
  getFinancial(
    @Req() request: AuthenticatedRequest,
  ): Promise<DashboardFinancialResponseDto> {
    return this.dashboardService.getFinancial(request.user.sub);
  }
}
