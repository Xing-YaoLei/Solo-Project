import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdatePaymentStatusDto } from './dto/invoices.dto';

@Controller()
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get('cases/:caseId/invoices')
  @UseGuards(AuthGuard('jwt'))
  findByCase(@Param('caseId') caseId: string) {
    return this.invoicesService.findByCase(caseId);
  }

  @Post('cases/:caseId/invoices')
  @UseGuards(AuthGuard('jwt'))
  create(
    @Param('caseId') caseId: string,
    @Req() req: any,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(caseId, req.user.userId, dto);
  }

  @Patch('cases/:caseId/payment-status')
  @UseGuards(AuthGuard('jwt'))
  updateCasePaymentStatus(
    @Param('caseId') caseId: string,
    @Req() req: any,
    @Body() dto: UpdatePaymentStatusDto & { invoiceId?: string },
  ) {
    return this.invoicesService.updatePaymentStatus(
      dto.invoiceId || '',
      caseId,
      req.user.userId,
      dto,
    );
  }

  @Patch('invoices/:id/payment-status')
  @UseGuards(AuthGuard('jwt'))
  updatePaymentStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.invoicesService.updatePaymentStatus(id, undefined, req.user.userId, dto);
  }
}
