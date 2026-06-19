import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { CheckinDocumentsService } from './checkin-documents.service';

@Controller('api/checkin-documents')
export class CheckinDocumentsController {
  constructor(private readonly checkinDocumentsService: CheckinDocumentsService) {}

  @Get()
  findAll(
    @Query('bookingId') bookingId?: string,
    @Query('propertyId') propertyId?: string,
    @Query('documentType') documentType?: string,
  ) {
    return this.checkinDocumentsService.findAll({ bookingId, propertyId, documentType });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkinDocumentsService.findOne(id);
  }

  @Post()
  create(@Body() data: {
    bookingId: string;
    propertyId: string;
    documentType: string;
    documentNumber: string;
    documentImage?: string;
    guestName: string;
    issueDate?: Date;
    expiryDate?: Date;
  }) {
    return this.checkinDocumentsService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: {
    documentType?: string;
    documentNumber?: string;
    documentImage?: string;
    guestName?: string;
    issueDate?: Date;
    expiryDate?: Date;
  }) {
    return this.checkinDocumentsService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.checkinDocumentsService.delete(id);
  }
}
