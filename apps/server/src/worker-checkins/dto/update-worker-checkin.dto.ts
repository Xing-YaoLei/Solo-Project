import { PartialType } from '@nestjs/swagger';
import { CreateWorkerCheckinDto } from './create-worker-checkin.dto';

export class UpdateWorkerCheckinDto extends PartialType(CreateWorkerCheckinDto) {}
