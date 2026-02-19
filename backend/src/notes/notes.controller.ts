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
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto, ReorderNotesDto, BulkOperationDto } from './note.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  private readonly logger = new Logger(NotesController.name);

  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(
    @Request() req: { user: { id: number } },
    @Query('categoryId') categoryId?: string,
  ) {
    const userId = req.user.id;
    if (categoryId) {
      return this.notesService.findByCategory(parseInt(categoryId, 10), userId);
    }
    return this.notesService.findAll(userId);
  }

  @Get('pinned')
  findPinned(@Request() req: { user: { id: number } }) {
    return this.notesService.findPinned(req.user.id);
  }

  @Get('archived')
  findArchived(@Request() req: { user: { id: number } }) {
    return this.notesService.findArchived(req.user.id);
  }

  @Post()
  create(
    @Request() req: { user: { id: number } },
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.notesService.create(createNoteDto, req.user.id);
  }

  @Delete('bulk')
  bulkDelete(
    @Request() req: { user: { id: number } },
    @Body() dto: BulkOperationDto,
  ) {
    return this.notesService.bulkDelete(dto, req.user.id);
  }

  @Patch('bulk/archive')
  bulkArchive(
    @Request() req: { user: { id: number } },
    @Body() dto: BulkOperationDto,
  ) {
    return this.notesService.bulkArchive(dto, req.user.id);
  }

  @Patch('reorder')
  reorder(
    @Request() req: { user: { id: number } },
    @Body() reorderDto: ReorderNotesDto,
  ) {
    return this.notesService.reorder(reorderDto, req.user.id);
  }

  @Patch(':id')
  async update(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    this.logger.log(`[PATCH /notes/${id}] Request received`);
    this.logger.debug(`[PATCH /notes/${id}] Body: ${JSON.stringify(updateNoteDto)}`);

    const result = await this.notesService.update(id, updateNoteDto, req.user.id);

    this.logger.debug(`[PATCH /notes/${id}] Response: id=${result.id}, hasContent=${!!result.content}`);
    this.logger.log(`[PATCH /notes/${id}] Request completed`);

    return result;
  }

  @Post(':id/duplicate')
  duplicate(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notesService.duplicate(id, req.user.id);
  }

  @Patch(':id/archive')
  archive(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notesService.archive(id, req.user.id);
  }

  @Patch(':id/unarchive')
  unarchive(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notesService.unarchive(id, req.user.id);
  }

  @Delete(':id')
  remove(
    @Request() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notesService.remove(id, req.user.id);
  }
}
