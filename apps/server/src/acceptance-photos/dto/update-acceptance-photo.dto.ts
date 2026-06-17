import { PartialType } from '@nestjs/swagger';
import { CreateAcceptancePhotoDto } from './create-acceptance-photo.dto';

export class UpdateAcceptancePhotoDto extends PartialType(CreateAcceptancePhotoDto) {}
