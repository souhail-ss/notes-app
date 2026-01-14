import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto, ReorderNotesDto, BulkOperationDto } from './note.dto';

@Controller('notes')
export class NotesController {
  private readonly logger = new Logger(NotesController.name);

  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    if (categoryId) {
      return this.notesService.findByCategory(parseInt(categoryId, 10));
    }
    return this.notesService.findAll();
  }

  @Get('pinned')
  findPinned() {
    return this.notesService.findPinned();
  }

  @Get('archived')
  findArchived() {
    return this.notesService.findArchived();
  }

  @Post()
  create(@Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create(createNoteDto);
  }

  @Delete('bulk')
  bulkDelete(@Body() dto: BulkOperationDto) {
    return this.notesService.bulkDelete(dto);
  }

  @Patch('bulk/archive')
  bulkArchive(@Body() dto: BulkOperationDto) {
    return this.notesService.bulkArchive(dto);
  }

  @Patch('reorder')
  reorder(@Body() reorderDto: ReorderNotesDto) {
    return this.notesService.reorder(reorderDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    this.logger.log(`[PATCH /notes/${id}] Request received`);
    this.logger.debug(`[PATCH /notes/${id}] Body: ${JSON.stringify(updateNoteDto)}`);

    const result = await this.notesService.update(id, updateNoteDto);

    this.logger.debug(`[PATCH /notes/${id}] Response: id=${result.id}, hasContent=${!!result.content}`);
    this.logger.log(`[PATCH /notes/${id}] Request completed`);

    return result;
  }

  @Post(':id/duplicate')
  duplicate(@Param('id', ParseIntPipe) id: number) {
    return this.notesService.duplicate(id);
  }

  @Patch(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.notesService.archive(id);
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id', ParseIntPipe) id: number) {
    return this.notesService.unarchive(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notesService.remove(id);
  }
}
