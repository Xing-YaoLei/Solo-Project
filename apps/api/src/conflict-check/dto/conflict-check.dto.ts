import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConflictCheckDto {
  @IsString()
  @IsOptional()
  note?: string;
}

export class ArchiveConflictCheckDto {
  @IsString()
  @IsNotEmpty()
  archivePath: string;
}
