import { PartialType } from '@nestjs/mapped-types';
import { CreateDiscussDto } from './create-discuss.dto';

export class UpdateDiscussDto extends PartialType(CreateDiscussDto) {}
