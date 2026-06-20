import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CheckInDictService } from './check-in-dict.service';
import {
  CreateCheckInDictDto,
  UpdateCheckInDictDto,
  FilterCheckInDictDto,
  CreateCheckInRecordDto,
  FilterCheckInRecordDto,
} from './check-in-dict.dto';

@Controller('check-in-dicts')
export class CheckInDictController {
  constructor(private readonly service: CheckInDictService) {}

  @Post()
  createDict(@Body() dto: CreateCheckInDictDto) {
    return this.service.createDict(dto);
  }

  @Get()
  findAllDicts(@Query() filter: FilterCheckInDictDto) {
    return this.service.findAllDicts(filter);
  }

  @Put(':id')
  updateDict(@Param('id') id: string, @Body() dto: UpdateCheckInDictDto) {
    return this.service.updateDict(id, dto);
  }

  @Delete(':id')
  removeDict(@Param('id') id: string) {
    return this.service.removeDict(id);
  }
}

@Controller('check-in-records')
export class CheckInRecordController {
  constructor(private readonly service: CheckInDictService) {}

  @Post()
  createRecord(@Body() dto: CreateCheckInRecordDto) {
    return this.service.createRecord(dto);
  }

  @Get()
  findAllRecords(@Query() filter: FilterCheckInRecordDto) {
    return this.service.findAllRecords(filter);
  }
}
