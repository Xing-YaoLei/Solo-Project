import { PartialType } from '@nestjs/swagger';
import { CreateChangeOrderDto } from './create-change-order.dto';

export class UpdateChangeOrderDto extends PartialType(CreateChangeOrderDto) {}
