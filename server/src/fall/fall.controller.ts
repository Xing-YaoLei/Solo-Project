import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FallService } from './fall.service';
import { CreateFallDto, CreateCommunicationDto, CreateReviewDto } from './dto/fall.dto';

@ApiTags('falls')
@Controller('falls')
export class FallController {
  constructor(private readonly fallService: FallService) {}

  @Get()
  @ApiOperation({ summary: 'List fall incidents with elder info' })
  findAll() {
    return this.fallService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fall detail with communications and review' })
  findOne(@Param('id') id: string) {
    return this.fallService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Report fall incident' })
  create(@Body() dto: CreateFallDto) {
    return this.fallService.create(dto);
  }

  @Post(':id/communications')
  @ApiOperation({ summary: 'Add communication record' })
  addCommunication(@Param('id') id: string, @Body() dto: CreateCommunicationDto) {
    return this.fallService.addCommunication(id, dto);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Submit review conclusion' })
  submitReview(@Param('id') id: string, @Body() dto: CreateReviewDto) {
    return this.fallService.submitReview(id, dto);
  }
}
