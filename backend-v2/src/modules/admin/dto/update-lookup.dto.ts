import { PartialType } from '@nestjs/swagger';
import { CreateLookupDto, CreateSiteDto, CreateTagDto } from './create-lookup.dto';

export class UpdateLookupDto extends PartialType(CreateLookupDto) {}

export class UpdateSiteDto extends PartialType(CreateSiteDto) {}

export class UpdateTagDto extends PartialType(CreateTagDto) {}
