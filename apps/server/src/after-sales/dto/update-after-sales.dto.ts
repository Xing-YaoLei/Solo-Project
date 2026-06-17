import { PartialType } from '@nestjs/swagger';
import { CreateAfterSalesDto } from './create-after-sales.dto';

export class UpdateAfterSalesDto extends PartialType(CreateAfterSalesDto) {}
