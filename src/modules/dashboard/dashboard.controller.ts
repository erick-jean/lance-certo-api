import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { RequirePlan } from 'src/common/decorators/require-plan.decorator';
import { PlanGuard } from 'src/common/guards/plan.guard';
import { AuthGuard } from '../auth/auth.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
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
    @CurrentUser() user: JwtPayload,
  ): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getDashboardSummary(user.sub);
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
    @CurrentUser() user: JwtPayload,
  ): Promise<DashboardFinancialResponseDto> {
    return this.dashboardService.getFinancialDashboard(user.sub);
  }
}
