import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export interface ListItem {
  id: string;
  text: string;
  completed: boolean;
}

export class CreateNoteDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @IsIn(['text', 'list'])
  type?: string;

  @IsOptional()
  @IsArray()
  listItems?: ListItem[];

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;
}

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  @IsIn(['text', 'list'])
  type?: string;

  @IsOptional()
  @IsArray()
  listItems?: ListItem[];

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;
}

export class BulkOperationDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export class NoteOrderDto {
  @IsNumber()
  id: number;

  @IsNumber()
  order: number;
}

export class ReorderNotesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NoteOrderDto)
  notes: NoteOrderDto[];
}
